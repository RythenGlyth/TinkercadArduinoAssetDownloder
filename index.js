const svgBoundingBox = require("svg-bounding-box")
const axios = require("axios").default;
var Inkscape = require('inkscape');
var fs = require('fs');
const { Readable } = require("stream")
const ffmpeg = require("ffmpeg-cli");

const reencode = true;
const delUnReen = true;
const size = 20;

axios("https://editor.tinkercad.com/assets_30ucufg/js/components/collections/basic-components.json").then(async (res) => {
    res.data.filter((x, i) => true).forEach(async el => {
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
                        /** @type {WritableStream} */
                        var piped = Readable.from([replaced]).pipe(new Inkscape([
                            "--export-type=png",
                            "--export-width=" + Math.round(boundingBox.width * size),
                            "--export-background-opacity=0"
                        ])).pipe(fs.createWriteStream(__dirname + "/out/" + elName + "/" + footPrntName + ".png"));
                        if(reencode) piped.on('finish', () => {
                            ffmpeg.run("-i \"" + __dirname + "/out/" + elName + "/" + footPrntName + ".png" + "\" \"" + __dirname + "/out/" + elName + "/" + footPrntName + "Reencoded.png\"").then(() => {
                                if(delUnReen) fs.rm(__dirname + "/out/" + elName + "/" + footPrntName + ".png", () => {});
                            }).catch((err) => {
                                console.log(err);
                            });
                        });
                    })
                }
            }
        }
    })
});