const Book = require("../models/book");
const { body, validationResult } = require("express-validator");


const Author = require("../models/author");
const asyncHandler = require("express-async-handler");

// Display list of all Authors.
// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
  const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
  res.render("author_list", {
    title: "Author List",
    author_list: allAuthors,
  });
});


// Display detail page for a specific Author.
// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    // No results.
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  res.render("author_detail", {
    title: "Author Detail",
    author: author,
    author_books: allBooksByAuthor,
  });
});


// Display Author create form on GET.
// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
};


// Handle Author create on POST.
// Handle Author create on POST.
exports.author_create_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create Author object with escaped and trimmed data
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("author_form", {
        title: "Create Author",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.

      // Save author.
      await author.save();
      // Redirect to new author record.
      res.redirect(author.url);
    }
  }),
];


// Display Author delete form on GET.
// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    // No results.
    res.redirect("/catalog/authors");
  }

  res.render("author_delete", {
    title: "Delete Author",
    author: author,
    author_books: allBooksByAuthor,
  });
});


// Handle Author delete on POST.
// Handle Author delete on POST.
// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  try {
    // Check if the author has any associated books
    const authorBooks = await Book.find({ author: req.body.authorid }).exec();
    
    if (authorBooks.length > 0) {
      // Author has associated books, render delete form with books
      const author = await Author.findById(req.body.authorid).exec();
      res.render("author_delete", {
        title: "Delete Author",
        author: author,
        author_books: authorBooks,
      });
    } else {
      // Author has no associated books, delete author and redirect to author list
      await Author.findByIdAndDelete(req.body.authorid);
      res.redirect("/catalog/authors");
    }
  } catch (err) {
    return next(err);
  }
});



// Display Author update form on GET.
// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
    // Get author
    const author = await Author.findById(req.params.id).exec();
      
    if (author === null) {
      // No results.
      const err = new Error("Author not found");
      err.status = 404;
      return next(err);
    }
    console.log("GET: author.date_of_birth:", author.date_of_birth );
    res.render("author_form", {
      title: "Update Author",
      author: author,
    });
});

// Handle Author update on POST.
exports.author_update_post = [
    // Validate and sanitize fields.
    body("first_name").trim().isLength({ min: 1 }).escape().withMessage("First name must be specified.").isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
    body("family_name").trim().isLength({ min: 1 }).escape().withMessage("Family name must be specified.").isAlphanumeric().withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth").optional({ values: "falsy" }).isISO8601().toDate(),//{ values: "falsy" } object passed means that we'll accept either an empty string or null as an empty value).
    body("date_of_death", "Invalid date of death").optional({ values: "falsy" }).isISO8601().toDate(),
  
    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create Author object with escaped and trimmed data
      const author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
        _id: req.params.id, // This is required, or a new ID will be assigned!
      });
      console.log("SET: req.body.date_of_birth:", req.body.date_of_birth);
  
      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/errors messages.
        res.render("author_form", {
          title: "Edit Author",
          author: author,
          errors: errors.array(),
        });
        return;
      } else {
        // Data from form is valid. Update the record.
        const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});
        // Redirect to book detail page.
        res.redirect(updatedAuthor.url);
      }
    }),
];