const exec = require('child_process').exec;
const fs = require('fs');

const is_base64 = (string) => /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(string)

const remove_file = (key) => {
  return new Promise((resolve, reject) => {
    fs.unlink(key, (err) => {
      if (err) return reject(err);

      return resolve({
        key: key
      });
    });
  })
}

const read_file = (key) => {
  return new Promise((resolve, reject) => {
    fs.readFile(key, (err, data) => {
      if(err) return reject(err);
      return resolve({
        file_content: data,
        key: key
      })
    })
  })
}

const write_file = (key, body) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(key, body, (err) => {
      if(err) return reject(err);
      return resolve({
        key: key,
        body: body
      });
    })
  })
}

const create_unencrypted_file_from_p7m = (file_written) => {
  return exec_command(`openssl smime -verify -noverify -in ${file_written.key} -inform DER -out ${file_written.key.replace('.p7m','')}`)
}

const exec_command = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if(error) return reject(error);
      return resolve(true) 
    });
  })
}

const delete_file_created = (file_read) => {
  //CONTENT READ NOW DELETE
  console.log("DELETE FIRST FILE CONTENT => ", file_read.key)
  
  return remove_file(file_read.key)
    .then(data => {
      return Promise.resolve({
        ...data, //key
        body: file_read.file_content
      })
    })
}

const delete_p7m_file_created = (file_read) => {
  //CONTENT READ, NOW DELETE P7M
  console.log("DELETE SECOND FILE CONTENT => ", file_read.key.concat('.p7m',''))
  return remove_file(file_read.key.concat('.p7m'))
    .then(data => {
      //RETURN KEY WITHOUT PATH
      let file_key = file_read.key.split('/tmp/').filter((el) => (el) ? el : null)[0];

      return Promise.resolve({
        key: file_key, 
        body: file_read.body
      })
    })
}

const decode_p7m = (key, body) => {
  let path = `/tmp/${key}`;
  //CHECK IF BODY IS BASE64 ENCODED AND DECODE IT
  body = (is_base64(body.toString())) ? Buffer.from(body.toString(), 'base64') : body
  return new Promise((resolve, reject) => {
    write_file(path, body)
      .then(create_unencrypted_file_from_p7m)
      .then(() => {
        //EXEC DONE
        console.log("READ FILE CONTENT => ", path.replace('.p7m',''))

        return read_file(path.replace('.p7m',''))
      })
      .then(delete_file_created)
      .then(delete_p7m_file_created)
      .then(resolve)
      .catch(err => {
        console.log("ERROR FROM P7M DECODE", err);
        reject(err)
      })
  })
}

module.exports = {
  decode_p7m
}