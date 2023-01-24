import {exec} from 'child_process';
import { readFile, unlink, writeFile } from 'fs/promises';

const is_base64 = (pattern: string) => /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(pattern);

const removeFile = async (key: string) => {
  try{
    await unlink(key)
    return {
      key
    }
  }catch (e){
    console.log("error in unlink");
    throw e;
  }
}

const readNewFile = async (key: string) => {
  try{
    const file = await readFile(key);
    return {
      fileContent: file,
      key: key
    }
  }catch (e){
    console.log("error in read file");
    throw e;
  }
}

const writeNewFile = async(key: string, body: Buffer) => {
  try {
    await writeFile(key, body);
    return {
      key,
      body
    }
  }catch (e) {
    console.log("error in file write");
    throw e;
  }
}

const createUnencryptedFileFromP7m = async (fileWritten: { key: string, body: Buffer }) => {
  return await execCommand(`openssl smime -verify -noverify -in ${fileWritten.key} -inform DER -out ${fileWritten.key.replace('.p7m','')}`);
}

const execCommand = async (command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if(error) return reject(error);
      return resolve(true);
    });
  })
}

const deleteFileCreated = async (fileRead: {key: string, fileContent: Buffer}) => {
  console.log(`DELETE FIRST FILE CONTENT =>  ${fileRead.key}`);

  const removed = await removeFile(fileRead.key);
  return {
    ...removed,
    body: fileRead.fileContent
  };
}

const deleteP7mFileCreated = async (fileRead: {key: string, body: Buffer}) => {
  console.log(`DELETE SECOND FILE CONTENT => ${fileRead.key.concat('.p7m','')}`);

  await removeFile(fileRead.key.concat('.p7m'));
  const fileKey = fileRead.key.split('/tmp/').filter((el) => (el) ? el : null)[0];
  return {
    key: fileKey,
    body: fileRead.body
  };
}

const decodeP7m = async (key: string, body: Buffer) => {
  let path = `/tmp/${key}`;
  //Check if body is base64 encoded and decode it
  body = (is_base64(body.toString())) ? Buffer.from(body.toString(), 'base64') : body;

  try{
    const writtenFile = await writeNewFile(path, body);
    const unencryptedFile = await createUnencryptedFileFromP7m(writtenFile);

    console.log(`READ FILE CONTENT => ${unencryptedFile} ${path.replace('.p7m','')}` );

    const fileContent = await readNewFile(path.replace('.p7m',''));
    const deletedFile = await deleteFileCreated(fileContent);
    const deletedFileP7m = await deleteP7mFileCreated(deletedFile);

    return deletedFileP7m;
  }catch (e) {
    console.log(`ERROR FROM P7M DECODE => ${e}`);
    throw e;
  }
}

export {
  decodeP7m
}
