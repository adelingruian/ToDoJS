const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/tododb');


//Create Item Schema
const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
});
const Item = mongoose.model("Item", itemsSchema)

//Create List Schema
const listSchema = new mongoose.Schema( {
    name: String,
    items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);


//Create a defaultItem list
item1 = new Item({name: "Welcome to your todolist!"});
item2 = new Item({name: "Hit the + button to add a new item."});
item3 = new Item({name: "<-- Hit this to delete an item."});
const defaultItems = [item1, item2, item3];



app.get('/', function (req, res) {

    const day = date.getDate();

    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log("Could not save default items into the database.");
                } else {
                    console.log("Succesful.");
                }
            });
            res.redirect('/');
        } else {
            res.render('list', {
                listTitle: day,
                listItems: foundItems
            });
        }
    });
});


app.get('/:listName', function (req, res) {

    const customListName = _.capitalize(req.params.listName);

    List.findOne({name: customListName}, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                })
                list.save();
                res.redirect('/' + customListName);
            } else {
                //Show an existing list
                res.render("list", {
                    listTitle: foundList.name,
                    listItems: foundList.items
                });
            }
        }
    });
});


app.post('/', function (req, res) {

    let newItem = new Item({name: req.body.newItem});
    let listName = req.body.list;

    if (listName === date.getDate()) {
        newItem.save();
        res.redirect('/');
    } else {
        List.findOne({name: listName}, function(err, foundList) {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect('/' + listName);
        });
    }
});


app.post('/delete', function (req,res) {

    const checkedItemID = req.body.checkbox;
    const listName = req.body.list;

    if (listName === date.getDate()) {
        Item.findByIdAndRemove(checkedItemID, function (err) {
            if (err) {
                console.log("Something went wrong.");
            } else {
                console.log("Success.");
            }
        })
        console.log("Item deleted" + req.body.checkbox);
        res.redirect('/');
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err) {
            if (err) {
                console.log("Something went wrong.")
            } else {
                console.log("Item was deleted.")
            }
        });
        res.redirect('/' + listName);
    }
})


app.listen(3000, function () {
    console.log("Server started o port 3000.");
});

