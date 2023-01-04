const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const userRouter = require("./routes/userRoutes");
const adminRouter = require("./routes/adminRoutes");
const cookieParser = require("cookie-parser");
const session = require("express-session");
require("dotenv").config();

mongoose
  .connect(process.env.MONGOOSE_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connected to database successfully");
  })
  .catch((err) => {
    console.log("Oh no mongo error!!!");
    console.log(err);
  });

app.set("views");
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  session({
    secret: "key",
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    resave: false,
  })
);
app.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});

app.use("/", userRouter);
app.use("/admin", adminRouter);

app.use((req,res)=>{
  res.status(404).render('user/404Error')
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).render('user/500Error')
})

app.listen(process.env.PORT);
