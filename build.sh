electron-packager . --overwrite --asar=true --platform=darwin --arch=x64 --out=dist
cd dist/pack-o-bot-darwin-x64 && zip -qry ../pack-o-bot-mac.zip pack-o-bot.app && cd -
rm -fr dist/pack-o-bot-darwin-x64
electron-packager . --overwrite --asar=true --platform=win32 --arch=ia32 --prune=true --out=dist --version-string.CompanyName="pack-o-bot" --version-string.FileDescription="pack-o-bot" --version-string.ProductName="pack-o-bot"
mv dist/pack-o-bot-win32-ia32 dist/pack-o-bot
cd dist && zip -qr pack-o-bot-win.zip pack-o-bot && cd -
rm -fr dist/pack-o-bot