var QR_CODE_LAYOUT = {
  padding: 10,
  qrSize: 72
}

function centeredText(doc, x_min, x_max, y, text) {
    var textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    var textOffset = x_min + ((x_max - textWidth) / 2);
    doc.text(textOffset, y, text);
}

function getQRTileDimensions() {
  var dim = {
    totalWidth: QR_CODE_LAYOUT.padding * 2 + QR_CODE_LAYOUT.qrSize,
    fontSize: QR_CODE_LAYOUT.qrSize / 4
  }
  dim.titleHeight = dim.fontSize + 5;
  dim.totalHeight = QR_CODE_LAYOUT.qrSize + dim.titleHeight + QR_CODE_LAYOUT.padding * 2

  return dim
}

function drawQRCodeTile(doc, x, y, qr, title) {
    var dim = getQRTileDimensions()

    var qr_y = y + QR_CODE_LAYOUT.padding;
    var t_y = qr_y + QR_CODE_LAYOUT.qrSize + QR_CODE_LAYOUT.padding * 2;
    var content_x = x + QR_CODE_LAYOUT.padding;
  
    doc.rect(x, y, dim.totalWidth, dim.totalHeight);
    doc.addImage(qr, 'PNG', content_x, qr_y, QR_CODE_LAYOUT.qrSize, QR_CODE_LAYOUT.qrSize);
    doc.setFontSize(dim.fontSize);
    centeredText(doc, x, dim.totalWidth, t_y, title);
}

// Taken from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function createQRCanvas(name, callback) {
    var div = document.createElement('div');
    div.id = name;
    div.style.display = 'none';

    document.body.appendChild(div);
}

function deleteQRCanvas(name, callback) {
    var qrCodeCanvas = document.getElementById(name)
    if (qrCodeCanvas) {
        qrCodeCanvas.parentElement.removeChild(qrCodeCanvas);
    }
}


function getQRDataURI(text, callback) {
    var elemName = 'qrcode-'
    createQRCanvas(elemName)

    var qrGenerator = new QRCode(elemName);

    qrGenerator.makeCode(text);
    var qrCodeDataURI = document
        .getElementById(elemName)
        .getElementsByTagName("canvas")[0]
        .toDataURL("image/png");

    deleteQRCanvas(elemName);

    return qrCodeDataURI
}

function makePDF(qr_data) {
    var doc = new jsPDF("portrait", "pt", "letter");
    
    var pageWidth = doc.internal.pageSize.width / doc.internal.scaleFactor;
    var pageHeight = doc.internal.pageSize.height / doc.internal.scaleFactor;
  
    var qrDim = getQRTileDimensions()
    var numTilesPerRow = Math.floor(pageWidth / qrDim.totalWidth);
    var numTilesPerColumn = Math.floor(pageHeight / qrDim.totalHeight);
    var numTilesPerPage = numTilesPerRow * numTilesPerColumn;

    var numPages = Math.ceil(qr_data.length / numTilesPerPage);

    var edgePadding = {
        x: (pageWidth - numTilesPerRow * qrDim.totalWidth) / 2,
        y: (pageHeight - numTilesPerColumn * qrDim.totalHeight) / 2
    }

    var i = 0;
    for (var pagePos = 0; pagePos < numPages; pagePos++) {
        for (var colPos = 0; colPos < numTilesPerColumn; colPos++) {
            for (var rowPos = 0; rowPos < numTilesPerRow; rowPos++) {
                if (i >= qr_data.length) {
                    break;
                }
                var qrCode = qr_data[i++];
              
                drawQRCodeTile(
                    doc,
                    edgePadding.x + rowPos * qrDim.totalWidth,
                    edgePadding.y + colPos * qrDim.totalHeight,
                    getQRDataURI(qrCode.url),
                    qrCode.title
                );
            }
        }
        if (pagePos + 1 < numPages) {
            doc.addPage();
        }
    }

    var pdfURI = doc.output('datauristring');
    document.getElementById("preview").src = pdfURI;
}

qr_data = []
for (var i = 0; i < 70; i++) {
  qr_data.push({
    url: "https://www.google.com",
    title: "test title"
  });
}

makePDF(qr_data);