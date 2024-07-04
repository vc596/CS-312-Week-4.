//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

const mongoose = require("mongoose");
const _ = require("lodash");
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = {

  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({

name: "Welcome to your todolist!"


});

const item2 = new Item({

  name: "Hit the + button to add a new item"
  
  
  });

  const item3 = new Item({

    name: ")---Hit this to delete an item"
    
    
    });
    
    const defaultItems =[item1, item2, item3];

    const listSchema = {

      name: String,
      items: [itemsSchema]
    };

    const List = mongoose.model("List", listSchema);

    app.get("/", async (req, res) => {
      try {
        const foundItems = await Item.find({});
        
        if (foundItems.length === 0) {
          await Item.insertMany(defaultItems);
          console.log("Successfully saved default items to DB");
          res.redirect("/"); // Redirect to root to fetch and render the items after insertion
        } else {
          res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
      } catch (err) {
        console.error("Error fetching or inserting items:", err);
      }
    });

    app.get("/:customListName", (req, res) => {
      const customListName = _.capitalize(req.params.customListName);
    
      List.findOne({ name: customListName }).then((foundList) => {
        if (!foundList) {
          // Create a new list if it doesn't exist
          const list = new List({
            name: customListName,
            items: defaultItems
          });
    
          list.save().then(() => {
            res.redirect("/" + customListName);
          }).catch((err) => {
            console.error("Error saving new list:", err);
            res.redirect("/");
          });
        } else {
          // Render the existing list
          res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        }
      }).catch((err) => {
        console.error("Error finding list:", err);
        res.redirect("/");
      });
    });
    
    
    

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){

    item.save();
  res.redirect("/");
  } else {

    List.findOne({ name: listName }).then((foundList) => {
      if (foundList) {
        foundList.items.push(item);
        foundList.save().then(() => {
          res.redirect("/" + listName);
        }).catch((err) => {
          console.error("Error saving list:", err);
        });
      } else {
        console.error("List not found:", listName);
        res.redirect("/");
      }
    }).catch((err) => {
      console.error("Error finding list:", err);
      res.redirect("/");
    });
  }
});

app.post("/delete", function (req,res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndDelete(checkedItemId).then(() => {
      console.log("Successfully deleted");
      res.redirect("/");
    }).catch((err) => {
      console.error("Error deleting item:", err);
    });
    
  } else {

    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    ).then((foundList) => {
      if (foundList) {
        res.redirect("/" + listName);
      } else {
        console.error("List not found:", listName);
        res.redirect("/");
      }
    }).catch((err) => {
      console.error("Error updating list:", err);
      res.redirect("/");
    });
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
