(async () =>{
    const sym = require("symbol-sdk");
    const NODE = "https://sym-test.opening-line.jp:3001";
    const repo = new sym.RepositoryFactoryHttp(NODE);

    networkType = await repo.getNetworkType().toPromise();
    generationHash = await repo.getGenerationHash().toPromise();
    epochAdjustment = await repo.getEpochAdjustment().toPromise();

    // アカウント作成
    generateAccount = sym.Account.generateNewAccount(networkType);
    console.log("作成したアカウントのアカウント情報:")
    console.dir(generateAccount, { depth: null });

    // 作成したアカウントの秘密鍵と公開鍵とアドレスの導出
    console.log("作成したアカウントの秘密鍵: " + generateAccount.privateKey);
    console.log("作成したアカウント公開鍵: " + generateAccount.publicKey);
    console.log("作成したアカウントのアドレス: " + generateAccount.address.plain());

    console.log("\n======================================================\n")

    // 秘密鍵からアカウント復元
    alice = sym.Account.createFromPrivateKey(
      "B4038C2F3F794EC63762261E53399C22403A26C2D94422C6642320A3316339D5", // アカウント復元する秘密鍵
      networkType
    );

    // 公開鍵クラスの生成
    alicePublicAccount = sym.PublicAccount.createFromPublicKey(
      "D4933FC1E4C56F9DF9314E9E0533173E1AB727BDB2A04B59F048124E93BEFBD2",
      networkType
    );
    console.log("aliceの公開鍵情報: ");
    console.dir(alicePublicAccount, { depth: null });

    // アドレスクラスの生成
    aliceAddress = sym.Address.createFromRawAddress(
      "TBXUTAX6O6EUVPB6X7OBNX6UUXBMPPAFX7KE5TQ"
    );
    console.log("aliceのアドレス情報:");
    console.dir(aliceAddress, { depth: null });

    console.log("\n======================================================\n")

    accountRepo = repo.createAccountRepository();
    accountInfo = await accountRepo.getAccountInfo(aliceAddress).toPromise();
    console.log("aliceのアカウント情報")
    console.dir(accountInfo, { depth: null });

    console.log("アドレスが記録されたブロック高: " + accountInfo.addressHeight.compact());

    console.log("\n======================================================\n")
  
    // 所有モザイク一覧の取得  
    console.log("所有モザイク一覧:");
    accountInfo.mosaics.forEach(async mosaic => {
    console.log("モザイクid:" + mosaic.id.toHex()); //16進数
    console.log("モザイク数量:" + mosaic.amount.toString()); //文字列
    });

    // 表示桁数の調整
    mosaicRepo = repo.createMosaicRepository();
    mosaicAmount = accountInfo.mosaics[0].amount.toString();
    mosaicInfo = await mosaicRepo.getMosaic(accountInfo.mosaics[0].id).toPromise();
    divisibility = mosaicInfo.divisibility; //可分性
    if(divisibility > 0){
    displayAmount = mosaicAmount.slice(0,mosaicAmount.length-divisibility)  + "." + mosaicAmount.slice(-divisibility);
    }else{
    displayAmount = mosaicAmount;
    }
    console.log("表示上のモザイク数量:" + displayAmount);

    console.log("\n======================================================\n")

    // bobアカウントの作成
    bob = sym.Account.generateNewAccount(networkType);
    bobPublicAccount = bob.publicAccount;

    console.log("\n======================================================\n")

    // Aliceの秘密鍵・Bobの公開鍵で暗号化し、Aliceの公開鍵・Bobの秘密鍵で復号します。
    message = 'Hello Symol!';
    encryptedMessage = alice.encryptMessage(message ,bob.publicAccount);
    console.log("暗号化後のメッセージ情報:");
    console.dir(encryptedMessage, { depth: null }); // TODO: でてない　

    console.log("\n======================================================\n")

    // 復号化
    decryptMessage = bob.decryptMessage(
    new sym.EncryptedMessage(
        "294C8979156C0D941270BAC191F7C689E93371EDBC36ADD8B920CF494012A97BA2D1A3759F9A6D55D5957E9D"
    ),
    alice.publicAccount
    ).payload
    console.log("復号化後のメッセージ情報: " + decryptMessage);

    console.log("\n======================================================\n")

    Buffer = require("buffer").Buffer;
    payload = Buffer.from("Hello Symol!", 'utf-8');
    signature = Buffer.from(sym.KeyPair.sign(alice.keyPair, payload)).toString("hex").toUpperCase();
    console.log(signature);

    // // 検証
    isVerified = sym.KeyPair.verify(
        alice.keyPair.publicKey,
        Buffer.from("Hello Symol!", 'utf-8'),
        Buffer.from(signature, 'hex')
    )
    console.log(isVerified);

    console.log("\n======================================================\n")

    // // 動かなさそう
    qr = require("symbol-qr-library");
    //パスフレーズでロックされたアカウント生成
    signerQR = qr.QRCodeGenerator.createExportAccount(
      alice.privateKey, networkType, generationHash, "ABCD" // パスフレーズ
    );
    jsonSignerQR = signerQR.toJSON();
    console.log("暗号化したアカウント情報 :\n" + jsonSignerQR);

    // 保存しておいたテキスト、あるいはQRコードスキャンで得られたテキストをjsonSignerQRに代入
    // jsonSignerQR = '{"v":3,"type":2,"network_id":152,"chain_id":"7FCCD304802016BEBBCD342A332F91FF1F3BB5E902988B352697BE245F48E836","data":{"ciphertext":"e9e2f76cb482fd054bc13b7ca7c9d086E7VxeGS/N8n1WGTc5MwshNMxUiOpSV2CNagtc6dDZ7rVZcnHXrrESS06CtDTLdD7qrNZEZAi166ucDUgk4Yst0P/XJfesCpXRxlzzNgcK8Q=","salt":"54de9318a44cc8990e01baba1bcb92fa111d5bcc0b02ffc6544d2816989dc0e9"}}';

    qr = require("symbol-qr-library");
    signerQR = qr.AccountQR.fromJSON(jsonSignerQR,"ABCD"); // パスフレーズ
    console.log("復号化したアカウントの秘密鍵:" + signerQR.accountPrivateKey);

})();