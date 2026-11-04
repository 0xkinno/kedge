'use client';
// The Lifeboat key is generated in the browser, encrypted with a passphrase the owner chooses, and never sent anywhere.
import { Wallet, encryptKeystoreJson } from 'ethers';
import QRCode from 'qrcode';

export async function makeLifeboat(passphrase: string) {
  if (passphrase.length < 8) throw new Error('Choose a passphrase of at least 8 characters.');
  const w = Wallet.createRandom();
  const keystore = await encryptKeystoreJson({ address: w.address, privateKey: w.privateKey }, passphrase, { scrypt: { N: 2 ** 14 } }); // lighter than the default so phones finish in seconds
  return { address: w.address, keystore };
}
export async function lifeboatPdf(owner: string, lifeboat: string, keystore: string) {
  const { jsPDF } = await import('jspdf');
  const qr = await QRCode.toDataURL(keystore, { errorCorrectionLevel: 'L', margin: 1, width: 600 });
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] }); // ID-1 wallet size
  doc.setFillColor(246, 241, 231); doc.rect(0, 0, 85.6, 54, 'F');
  doc.setTextColor(12, 37, 54); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text('KEDGE  Lifeboat Card', 5, 9);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.2);
  doc.text(['Keep this with your passport and Seaman\'s Book.', 'It cannot move money by itself. It is your new wallet key,', 'locked with the passphrase only you know.'], 5, 15);
  doc.setFont('courier', 'normal'); doc.setFontSize(5.2); doc.text(['Old wallet:', owner, 'New wallet:', lifeboat], 5, 29);
  doc.addImage(qr, 'PNG', 55, 5, 26, 26);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(5.8);
  doc.text(['If your phone is lost: call a guardian. They will ask you to read four', 'words from the Kedge app on your new phone. Scan the code, enter your', 'passphrase, and open Kedge to bring your wallet home.'], 5, 42);
  doc.setFontSize(5); doc.text('Fictional persona in the demo. Testnet only.', 5, 51);
  return doc.output('blob');
}
