import * as fs from 'fs';
import crypto from 'crypto';

const algorithm = 'aes-256-ctr';
let key = 'MySecretKey';

key = crypto.createHash('sha256').update(String(key)).digest('base64').substring(0, 32);

const encrypt = (buffer: Buffer): Buffer => {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);


    const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
    return result;
}

const decrypt = (encrypted: Buffer): Buffer => {
    const iv = Uint8Array.prototype.slice.call(encrypted, 0, 16);
    const encryptedData = Uint8Array.prototype.slice.call(encrypted, 16);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted;
}

export const encryptFileByPath = (filePath: string) => {
    fs.readFile(filePath, (err, file) => {
        if (err) return console.error(err.message);
        if (file) {

            const encryptedFile = encrypt(file);
            fs.writeFile(filePath, encryptedFile, (file) => {
                if (file) {
                    console.log(`${filePath} encrypted`);
                }
            })

        }
    })
}


export const decryptFileByPath = (filePath: string) => {
    fs.readFile(filePath, (err, file) => {
        if (err) return console.error(err.message);
        if (file) {

            const decryptedFile = decrypt(file);
            fs.writeFile(filePath, decryptedFile, (file) => {
                if (file) {
                    console.log(`${filePath} decrypted`);
                }
            })
        }
    })
}