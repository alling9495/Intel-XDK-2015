var asset = {
    HelloWorld_png : "asset/HelloWorld.png",
    CloseNormal_png : "asset/CloseNormal.png",

    CloseSelected_png : "asset/CloseSelected.png",
    map_01 : "asset/tiled_sprites/Map_01.tmx"
};

var g_resources = [];
for (var i in asset) {
    g_resources.push(asset[i]);
}