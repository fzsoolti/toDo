const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//MONGOOSE database
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//MONGOOSE feedback
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("connected");
});

//MONGOOSE schema
const itemsSchema = {
  name: String,
};

//MONGOOSE model (collection)
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your tocolist!",
});

const item2 = new Item({
  name: "Welcome to your tocolist! 2",
});

const item3 = new Item({
  name: "Welcome to your tocolist! 3",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);

//
app.get("/", (req, res) => {
  //FIND
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("succes insert default items");
        }
      });
      res.redirect("/");
    } else{
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }

  });
});

app.get("/:customListName",(req,res)=>{
  const customListName = _.capitalize(req.params.customListName);
  

  List.findOne({name: customListName}, (err, foundList)=>{
    if (!err) {
      if (!foundList) {

        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + customListName);
      } else{
        res.render("list",{ listTitle: foundList.name, newListItems: foundList.items })
      }
    }
  })

});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, (err,foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }

});

app.post("/delete",(req,res)=>{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({_id: checkedItemId}, (err)=>{
      if (err) {
        console.log(err);
      }else{
        console.log("deleted");
        res.redirect("/");
      }
    });
  } else{
    List.updateOne({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList)=>{
      if (!err) {
        res.redirect("/"+listName);
      } else{
        console.log(err);
      }
    });
  }
  
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("started");
});
