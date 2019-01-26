const { decode_p7m } = require('../src');

const p7m_file_content = require('fs').readFileSync('example_p7m_file.p7m'); //Buffer p7m file content
const p7m_file_key = 'example_p7m_file.xml.p7m';

decode_p7m(p7m_file_key, p7m_file_content)
  .then(decoded => {
    /*
      Object 
      {
        key: "example_p7m_file.xml",
        body: Buffer with decoded content
      }
     */
    console.log("DECODED => ", decoded.body.toString())
  })