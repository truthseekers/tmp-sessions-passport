require("dotenv").config();

// var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
// var logger = require("morgan");
var passport = require("passport");
var session = require("express-session");
var LocalStrategy = require("passport-local");

var db = require("./db");
var SQLiteStore = require("connect-sqlite3")(session);
var crypto = require("crypto");

// var indexRouter = require("./routes/index");
var authRouter = require("./routes/auth");

var app = express();

// app.locals.pluralize = require("pluralize");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({ db: "sessions.db", dir: "./var/db" }),
  })
);

app.use(passport.authenticate("session"));

passport.use(
  "login",
  new LocalStrategy(function verify(username, password, cb) {
    console.log("Please work dammit", username, password);

    passport.serializeUser(function (user, cb) {
      console.log("out in global! outer serialize");
      process.nextTick(function () {
        console.log("in nextTick serialize");
        cb(null, { id: user.id, username: user.username });
      });
    });

    passport.deserializeUser(function (user, cb) {
      console.log("out in global! outer deserialize");
      process.nextTick(function () {
        console.log("nextTick deserialize");
        return cb(null, user);
      });
    });

    // 1. find the user in the database.
    // 2. if some error??? have an error message and return cb(err)
    // 3. if the row doesn't exist,j (wrong username or password)
    /////////// - return cb(null, false, { message: "Incorrect username or password"})
    // 4. ?? after cb serialize? IDFK

    // flow A:
    // 1. Find user in db.
    // 2. serialize & deserialize????
    // 3. verify the password?
    // 4. cb(null, row) // null error, row = the user.

    // find user in db:
    const user = { username: "alice", password: "letmein", id: "2" };

    // console.log(".... user is legit!");

    if (username == "error") {
      try {
        throw new Error("Oh crap");
      } catch (err) {
        console.log("err.message: ", err.message);
        // This SHOULD send me to the failure redirect right? The user isn't even passed into the callback, and the first argument is an error object, which isn't null.
        // Why is the "incorrect username/password" directing to the failure when the error object is null? Makes no sense.
        cb(err.message);
      }
      console.log("an error! Oh dear!");
      return cb({ errorMsg: "Oops!" });
    }

    if (username == "alice" && password == "letmein") {
      // not sure the difference between returning and not returning...
      return cb(null, user);
    } else {
      // How do I access that stupid message property in the route or wherever?
      return cb(null, false, {
        message: "Incorrect username or password.",
      });
    }

    // db.get(
    //   "SELECT * FROM users WHERE username = ?",
    //   [username],
    //   function (err, row) {
    //     if (err) {
    //       console.log("Returning the ERROR");
    //       return cb(err);
    //     }
    //     if (!row) {
    //       console.log(
    //         "Returning a NULL error but a message as the last arg to cb"
    //       );
    //       return cb(null, false, {
    //         message: "Incorrect username or password.",
    //       });
    //     }

    //     /////////////////////////// Begin:  Not sure where this goes
    //     passport.serializeUser(function (user, cb) {
    //       process.nextTick(function () {
    //         cb(null, { id: user.id, username: user.username });
    //       });
    //     });

    //     passport.deserializeUser(function (user, cb) {
    //       process.nextTick(function () {
    //         return cb(null, user);
    //       });
    //     });
    //     ///////////////////////////////// End: Not sure where this goes
    //     console.log("password in passport.use: ", password);
    //     crypto.pbkdf2(
    //       password,
    //       row.salt,
    //       310000,
    //       32,
    //       "sha256",
    //       function (err, hashedPassword) {
    //         console.log("pbkdf2 in the thing: hashed", hashedPassword);
    //         console.log("normal: ", password);
    //         if (err) {
    //           console.log("error in the passport.use version of crypto.pbkdf2");
    //           return cb(err);
    //         }
    //         }
  })
);

app.get("/", function (req, res, next) {
  res.send("nothing here. See the /login route");
});

// 1.
app.get("/successlogin", function (req, res, next) {
  console.log("successlogin");
  res.render("successlogin");
});

app.get("/successloginresult", function (req, res, next) {
  console.log("successloginresult");
  res.send("successloginresult");
});

// app.get("/login", function (req, res, next) {
//   console.log("At the login route...");
//   res.render("login");
// });

app.get("/failureloginresult", function (req, res, next) {
  console.log("********** REQ IN FAILURELOGINRESULT ***********: ", req);
  console.log("********** RES IN FAILURELOGINRESULT ***********: ", res);

  res.send("failureloginresult");
});

app.get("/login", function (req, res, next) {
  console.log("At the login route in app.js the auth one dont exist...");
  res.render("login");
});

app.post(
  "/login/password",
  // made the name of this authentication strategy "login".
  passport.authenticate("login", {
    // passport.authenticate("local", { "local" is the "name" of the strategy. "local" I think is a default? If no name is given use local.
    successRedirect: "/successloginresult",
    failureRedirect: "/failureloginresult",
    // failureRedirect: "/login",
  }),
  function (req, res, next) {
    console.log("holy hell these docs are awful");
  }
);

// app.use("/", indexRouter);
app.use("/", authRouter);

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render("error");
// });

app.listen(3000, () => {
  console.log("server started");
});

// module.exports = app;
