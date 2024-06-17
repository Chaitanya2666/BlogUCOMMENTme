const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

// Render form to add new blog
router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
    blog: null, // Pass null when adding new blog
  });
});

// Render form to edit existing blog
router.get("/edit/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send("Blog not found");
    }
    return res.render("addBlog", {
      user: req.user,
      blog: blog, // Pass the found blog object
    });
  } catch (err) {
    console.error("Error fetching blog:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// Update existing blog
router.post("/update/:id", upload.single("coverImage"), async (req, res) => {
  try {
    const { title, body } = req.body;
    const updateData = {
      title,
      body,
    };
    if (req.file) {
      updateData.coverImageURL = `/uploads/${req.file.filename}`;
    }
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updatedBlog) {
      return res.status(404).send("Blog not found");
    }
    return res.redirect(`/blog/${req.params.id}`);
  } catch (err) {
    console.error("Error updating blog:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// Get details of a specific blog
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    if (!blog) {
      return res.status(404).send("Blog not found");
    }
    const comments = await Comment.find({ blogId: req.params.id }).populate(
      "createdBy"
    );

    return res.render("blog", {
      user: req.user,
      blog,
      comments,
    });
  } catch (err) {
    console.error("Error fetching blog:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// Add a new comment to a blog
router.post("/comment/:blogId", async (req, res) => {
  try {
    await Comment.create({
      content: req.body.content,
      blogId: req.params.blogId,
      createdBy: req.user._id,
    });
    return res.redirect(`/blog/${req.params.blogId}`);
  } catch (err) {
    console.error("Error creating comment:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// Add a new blog
router.post("/", upload.single("coverImage"), async (req, res) => {
  try {
    const { title, body } = req.body;
    const blog = await Blog.create({
      body,
      title,
      createdBy: req.user._id,
      coverImageURL: `/uploads/${req.file.filename}`,
    });
    return res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    console.error("Error creating blog:", err);
    return res.status(500).send("Internal Server Error");
  }
});

// Delete a blog
router.delete("/delete/:title", async (req, res) => {
  try {
    const body = req.params.title;
    const data = await Blog.findOneAndDelete({ title: body });
    return res.status(200).redirect("/");
  } catch (err) {
    console.error("Error deleting blog:", err);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
