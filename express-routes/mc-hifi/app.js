// https://wiki.vg/Mojang_API
const request = require("request-promise-native");
const express = require("express");
const Jimp = require("jimp");
const fs = require("fs");

var app = express();

/*
const getUUID = username=>new Promise((resolve, reject)=>{
	request("https://api.mojang.com/users/profiles/minecraft/"+username).then(json=>{
		try {
			json = JSON.parse(json);
			if (json.id==undefined) return reject("Could not parse JSON");
			return resolve(json.id);
		} catch {
			return reject("Could not parse JSON");
		}
	}).catch(err=>{
		return reject("Username not found");
	});
});

const getSkin = uuid=>new Promise((resolve, reject)=>{
	request("https://sessionserver.mojang.com/session/minecraft/profile/"+uuid).then(json=>{
		try {
			json = JSON.parse(json);
			if (json.properties==undefined) return reject("Skin not found");
			if (json.properties[0]==undefined) return reject("Skin not found");
			if (json.properties[0].value==undefined) return reject("Skin not found");
			return resolve("data:image/png;base64,"+json.properties[0].value);
		} catch {
			return reject("Could not parse JSON");
		}
	}).catch(err=>{
		return reject("UUID not found");
	});
});
*/

const getSkin = username =>
	new Promise((resolve, reject) => {
		request({
			url:
				"https://minecraftskinstealer.com/api/v1/skin/download/skin/" +
				username,
			encoding: null,
		})
			.then(skin => {
				return resolve(skin);
			})
			.catch(err => {
				return reject("Username not found");
			});
	});

var skinCache = {};

app.get("/skin/:username", async (req, res) => {
	if (!req.params.username) return res.end();
	let username = req.params.username;

	if (username.toLowerCase().endsWith(".png")) {
		username = username.substring(0, username.length - 4);
	}

	if (skinCache[username] != undefined) {
		res.setHeader("Content-Type", "image/png");
		res.end(skinCache[username]);
		return;
	}

	getSkin(username)
		.then(skin => {
			Jimp.read(skin)
				.then(image => {
					if (image.bitmap.height == 32)
						image.contain(64, 64, Jimp.VERTICAL_ALIGN_TOP);

					image.resize(2048, 2048, Jimp.RESIZE_NEAREST_NEIGHBOR);
					image
						.getBufferAsync(Jimp.MIME_PNG)
						.then(buffer => {
							skinCache[username] = buffer;
							res.setHeader("Content-Type", "image/png");
							res.end(buffer);
						})
						.catch(err => {
							return res.end();
						});
				})
				.catch(err => {
					return res.end();
				});
		})
		.catch(err => {
			return res.end();
		});
});

app.get("/avatar.fbx", (req, res) => {
	res.end(fs.readFileSync(__dirname + "/avatar.fbx"));
});

app.get("/:username", (req, res) => {
	if (!req.params.username) return res.end();
	let username = req.params.username;

	if (username.toLowerCase().endsWith(".fst")) {
		username = username.substring(0, username.length - 4);
	}

	let url = "https://maki.cafe/mc-hifi/skin/" + username + ".png";
	let fst = fs.readFileSync(__dirname + "/avatar.fst", "utf8");
	let materialMap = {
		all: {
			materials: {
				unlit: true,
				albedoMap: url,
				opacityMap: url,
			},
		},
	};
	fst += "\nmaterialMap = " + JSON.stringify(materialMap);

	res.end(fst);
});

var port = 8086;
app.listen(port, () => {
	console.log("Server up on *:" + port);
});
