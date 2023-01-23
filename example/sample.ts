import { decodeP7m } from "../src";

const p7mFileContent = require('fs').readFileSync('./example/sample.pdf.p7m'); //Buffer p7m file content
const p7mFileKey = 'sample.pdf.p7m';

decodeP7m(p7mFileKey, p7mFileContent)
  .then((decoded: {key: string, body: Buffer}) => {
    /*
    Object
    {
      key: "example_p7m_file.xml",
      body: Buffer with decoded content
    }
   */
    // require('fs').writeFileSync(decoded.key, decoded.body, "binary")
    // console.log("DECODED => ", decoded.body.toString())
  })
