const svgBoundingBox = require("svg-bounding-box")
const axios = require("axios").default;
var Inkscape = require('inkscape');
var fs = require('fs');
const { Readable } = require("stream")

axios("https://editor.tinkercad.com/assets_30ucufg/js/components/collections/basic-components.json").then(async (res) => {
    res.data.forEach(async el => {
        var footprint = el.footprints ? el.footprints[0] : el.footprint;
        if(footprint.name != "Category") {
            var footBod = await new Promise((resolve, reject) => {
                axios("https://editor.tinkercad.com/assets_30ucufg/js/packaged_devices/" + footprint.id + ".json").then((res) => {
                    resolve(res.data);
                }).catch((err) => {
                    resolve();
                });
            });
            if(footBod) {
                var svg = footBod.device.breadboard.svg;
                var boundingBox = await new Promise((resolve, reject) => {
                    svgBoundingBox(svg).then((res) => {
                        resolve(res);
                    }).catch(err => {
                        resolve();
                    })
                });
                if(boundingBox) {
                    var replaced = svg.replace(`viewBox="-1000 -1000 2000 2000" width="2000" height="2000"`, `viewBox="${boundingBox.minX} ${boundingBox.minY} ${boundingBox.width} ${boundingBox.height}" width="${boundingBox.width}" height="${boundingBox.height}"`);
                    var elName = el.name.replace(/[^a-zA-Z0-9_\-.]/g, "_");
                    var footPrntName = footprint.name.replace(/\//g, ".");
                    fs.mkdir(__dirname + "/out/" + elName + "/", {
                        recursive: true
                    }, (err, path) => {
                        fs.writeFile(__dirname + "/out/" + elName + "/" + footPrntName + ".svg", replaced, () => {
    
                        });
                        Readable.from([replaced]).pipe(new Inkscape([
                            "--export-type=png",
                            "--export-width=" + Math.round(boundingBox.width * 20),
                            "--export-background-opacity=0"
                        ])).pipe(fs.createWriteStream(__dirname + "/out/" + elName + "/" + footPrntName + ".png"));
                    })
                }
            }
        }
    })
});