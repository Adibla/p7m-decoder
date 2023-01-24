const { decodeP7m } = require("../dist")

const p7mFileContent = require('fs').readFileSync('./example/test.xml.p7m'); //Buffer p7m file content, sync method is used only for example, NEVER USE IT
const p7mFileKey = 'test.xml.p7m';
decodeP7m(p7mFileKey, p7mFileContent)
    .then(decoded => {
        /*
          Object
          {
            key: "test.xml",
            body: Buffer with decoded content
          }
         */
        console.log("DECODED => ", decoded.body.toString())
    })
