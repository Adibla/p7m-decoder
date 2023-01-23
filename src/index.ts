import {exec} from 'child_process';
import { readFile, unlink, writeFile } from 'fs/promises';

const is_base64 = (pattern: string) => /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(pattern)

const removeFile = async (key: string) => {
  try{
    const unlinked = await unlink(key)
    return {
      key
    }
  }catch (e){
    console.log("error in unlink")
    throw e;
  }
}

const readNewFile = async (key: string) => {
  try{
    const file = await readFile(key);
    return {
      file_content: file,
      key: key
    }
  }catch (e){
    console.log("error in read file")
    throw e;
  }
}

const writeNewFile = async(key: string, body: Buffer) => {
  try {
    const file = await writeFile(key, body);
    return {
      key,
      body
    }
  }catch (e) {
    console.log("error in file write");
    throw e;
  }
}

const createUnencryptedFileFromP7m = async (file_written: { key: string, body: Buffer }) => {
  return await execCommand(`openssl smime -verify -noverify -in ${file_written.key} -inform DER -out ${file_written.key.replace('.p7m','')}`)
}

const execCommand = async (command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if(error) return reject(error);
      return resolve(true)
    });
  })
}

const deleteFileCreated = async (file_read: {key: string, file_content: Buffer}) => {
  //CONTENT READ NOW DELETE
  console.log("DELETE FIRST FILE CONTENT => ", file_read.key)
  const removed = await removeFile(file_read.key);
  return {
    ...removed,
    body: file_read.file_content
  }
}

const deleteP7mFileCreated = async (fileRead: {key: string, body: Buffer}) => {
  //CONTENT READ, NOW DELETE P7M
  console.log("DELETE SECOND FILE CONTENT => ", fileRead.key.concat('.p7m',''))
  const removed = await removeFile(fileRead.key.concat('.p7m'));
  const fileKey = fileRead.key.split('/tmp/').filter((el) => (el) ? el : null)[0];
  return {
    key: fileKey,
    body: fileRead.body
  }
}

const decodeP7m = async (key: string, body: Buffer) => {
  let path = `/tmp/${key}`;
  //CHECK IF BODY IS BASE64 ENCODED AND DECODE IT
  body = (is_base64(body.toString())) ? Buffer.from(body.toString(), 'base64') : body

  try{
    const writtenFile = await writeNewFile(path, body);
    const unencryptedFile = await createUnencryptedFileFromP7m(writtenFile);

    console.log("READ FILE CONTENT => ",unencryptedFile, path.replace('.p7m',''))

    const fileContent = await readNewFile(path.replace('.p7m',''));
    const deletedFile = await deleteFileCreated(fileContent);
    const deletedFileP7m = await deleteP7mFileCreated(deletedFile);
    return deletedFileP7m;
  }catch (e) {
    console.log("ERROR FROM P7M DECODE", e);
    throw e;
  }
}

export {
  decodeP7m
}
