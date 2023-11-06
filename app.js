const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { log } = require("console");

const app = express();
const port = process.env.PORT || 3000;
const dates = require(__dirname + "/dates.js");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const mongoDB = "mongodb://127.0.0.1:27017/todoListDB";

main().catch((err) => log(err));

app.listen(port, () => {
	log("Server started on port " + port);
});

// Main :
async function main() {
	await mongoose.connect(mongoDB);

	const itemsSchema = {
		name: String,
	};
	const Item = mongoose.model("Item", itemsSchema);

	const defaultItems = [
		new Item({
			name: "Eat breakfast",
		}),
		new Item({
			name: "Do some Yoga",
		}),
		new Item({
			name: "Continue the course",
		}),
	];

	const listSchema = {
		name: String,
		items: [itemsSchema],
	};
	const List = mongoose.model("List", listSchema);
	const defaultListName = "Today";

	app.get("/", async (req, res) => {
		await List.findOne({ name: defaultListName })
			.then(async (doc) => {
				if (!doc) {
					// Create a new list
					const list = new List({
						name: defaultListName,
						items: defaultItems,
					});
					await list.save();
					res.redirect("/");
				} else {
					// Show an existing list
					res.render("list", {
						date: dates.getDate(),
						listName: doc.name,
						itemsList: doc.items,
					});
				}
			})
			.catch((err) => log(err));
	});

	app.get("/:customListName", async (req, res) => {
		const listName = _.capitalize(req.params.customListName);
		if (listName === defaultListName) {
			res.redirect("/");
		} else {
			if (listName != req.params.customListName) {
				res.redirect("/" + listName);
			} else {
				await List.findOne({ name: listName })
					.then(async (doc) => {
						if (!doc) {
							// Create a new list
							const list = new List({
								name: listName,
								items: defaultItems,
							});
							await list.save();
							res.redirect("/" + listName);
						} else {
							// Show an existing list
							res.render("list", {
								date: dates.getDate(),
								listName: doc.name,
								itemsList: doc.items,
							});
						}
					})
					.catch((err) => log(err));
			}
		}
	});

	app.post("/add", async (req, res) => {
		const listName = req.body.addItemToList;
		const addedItemName = req.body.todoItem;
		const addedItem = new Item({
			name: addedItemName,
		});
		await List.findOne({ name: listName })
			.then(async (doc) => {
				doc.items.push(addedItem);
				await doc.save();
			})
			.catch((err) => log(err));
		res.redirect("/" + listName);
	});

	app.post("/delete", async (req, res) => {
		const checkedItemList = req.body.listName;
		const checkedItemID = req.body.checkbox;
		await List.findOneAndUpdate(
			{ name: checkedItemList },
			{ $pull: { items: { _id: checkedItemID } } }
		);
		res.redirect("/" + checkedItemList);
	});
}
