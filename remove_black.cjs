const Jimp = require('jimp');

async function processImage() {
    try {
        const imgPath = 'c:\\Projects\\Raphael\\FighterRoyale\\public\\assets\\wall.png';
        const image = await Jimp.read(imgPath);

        // Set near-black pixels to transparent
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];

            // Threshold for "black"
            if (r < 10 && g < 10 && b < 10) {
                this.bitmap.data[idx + 3] = 0; // Set Alpha to 0 (fully transparent)
            }
        });

        await image.writeAsync(imgPath);
        console.log('Successfully removed black background from wall image.');
    } catch (err) {
        console.error('Error processing image:', err);
    }
}

processImage();
