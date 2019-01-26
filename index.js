const exec = require('child_process').exec;
const fs = require('fs');

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
  //CONTENT READ, NOW DELETE FILE  
  return remove_file(file_read.key)
    .then(data => {
      return Promise.resolve({
        ...data,
        body: file_read.file_content
      })
    })
}

const delete_p7m_file_created = (file_read) => {
  //CONTENT READ, NOW DELETE P7M FILE
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
  //SAVE FILE IN TMP FOLDER
  let path = `/tmp/${key}`
  
  return new Promise((resolve, reject) => {
    write_file(path, body)
      .then(create_unencrypted_file_from_p7m)
      .then(() => {
        //EXEC DONE, NOW READ FILE CLEARED
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