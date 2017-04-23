$(function() {
    $('#exec').click(function() {
        /* Act on the event */
        $('.inputfile').click();
    });
    $('#refresh').click(function() {
        /* Act on the event */
        $(".controls button").click();
    });
    $('#conf').click(function() {
        $(".reader-config-group").toggle();
    });
    $('#cennik1').load('cennik_rational.html');
    var App = {
        init: function() {
            App.attachListeners();
        },
        config: {
            reader: "code_39",
            length: 11
        },
        attachListeners: function() {
            var self = this;

            $(".controls input[type=file]").on("change", function(e) {
                if (e.target.files && e.target.files.length) {
                    App.decode(URL.createObjectURL(e.target.files[0]));
                }
            });

            $(".controls button").on("click", function(e) {
                var input = document.querySelector(".controls input[type=file]");
                if (input.files && input.files.length) {
                    App.decode(URL.createObjectURL(input.files[0]));
                    console.log(input.files[0])
                }
            });

            $(".controls .reader-config-group").on("change", "input, select", function(e) {  //sprawdzanie zmian w konfigu
                e.preventDefault();
                var $target = $(e.target),
                    value = $target.attr("type") === "checkbox" ? $target.prop("checked") : $target.val(),
                    name = $target.attr("name"),
                    state = self._convertNameToState(name);

                console.log("Value of "+ state + " changed to " + value);
                self.setState(state, value);
            });

        },
        _accessByPath: function(obj, path, val) {
            var parts = path.split('.'),
                depth = parts.length,
                setter = (typeof val !== "undefined") ? true : false;

            return parts.reduce(function(o, key, i) {
                if (setter && (i + 1) === depth) {
                    o[key] = val;
                }
                return key in o ? o[key] : {};
            }, obj);
        },
        _convertNameToState: function(name) {
            return name.replace("_", ".").split("-").reduce(function(result, value) {
                return result + value.charAt(0).toUpperCase() + value.substring(1);
            });
        },
        detachListeners: function() {
            $(".controls input[type=file]").off("change");
            $(".controls .reader-config-group").off("change", "input, select");
            $(".controls button").off("click");

        },
        decode: function(src) {
            var self = this,
                config = $.extend({}, self.state, {src: src});

            Quagga.decodeSingle(config, function(result) {});
        },
        setState: function(path, value) {
            var self = this;

            if (typeof self._accessByPath(self.inputMapper, path) === "function") {
                value = self._accessByPath(self.inputMapper, path)(value);
            }

            self._accessByPath(self.state, path, value);

            console.log(JSON.stringify(self.state));
            App.detachListeners();
            App.init();
        },
        inputMapper: {
            inputStream: {
                size: function(value){
                    return parseInt(value);
                }
            },
            numOfWorkers: function(value) {
                return parseInt(value);
            },
            decoder: {
                readers: function(value) {
                    if (value === 'ean_extended') {
                        return [{
                            format: "ean_reader",
                            config: {
                                supplements: [
                                    'ean_5_reader', 'ean_2_reader'
                                ]
                            }
                        }];
                    }
                    return [{
                        format: value + "_reader",
                        config: {}
                    }];
                }
            }
        },
        state: {
            inputStream: {
                size: 800
            },
            locator: {
                patchSize: "large",
                halfSample: false
            },
            numOfWorkers: 1,
            decoder: {
                readers: [{
                    format: "code_39_reader",
                    config: {}
                }]
            },
            locate: true,
            src: null
        }
    };

    App.init();

    Quagga.onProcessed(function(result) {
        console.log('zaczynam processed');
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: "green", lineWidth: 2});
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "#00F", lineWidth: 2});
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3});
            }
        }
        console.log('Wynik:' +result);
    });

    Quagga.onDetected(function(result) {
        console.log('wykryto');
        var code = result.codeResult.code,
            $node,
            canvas = Quagga.canvas.dom.image;
            console.log(code);
            //moj kod
            var price=$('#cennik1').html();
            var temp=0;
            code=code.substring(0,code.length-1);
            var number='number'
            while(number.length<18){
             //tutaj poprawic i usuwac znaki ktore nigdy nie wystepuja
            
            number=price.indexOf(code,temp);
            if(number>-1){
            temp=number+code.length;
            var name=price.indexOf('<p class="calibre1">',temp);
            number=price.substring(number,name);
            }else{
                break;
            }
            }

            var cena=price.indexOf('<p class="calibre1">',name+20);
            
            name=price.substring(name,cena);
            cena=price.substring(cena,price.indexOf('<p class="calibre1">',cena+20));
            if(cena.match(/[0-9]+,+\d*/g)){
                console.log(cena);
            }else{
                cena='';
            }

            console.log(number, name, cena);


            //moj kod

        $node = $('<li><div class="thumbnail"><div class="imgWrapper"><img /></div><div class="caption"><h5 class="code"></h4></div></div></li>');
        $node.find("img").attr("src", canvas.toDataURL());
        $node.find("h5.code").html(number+'<br>'+name+cena);
        $("#result_strip ul.thumbnails").prepend($node);
    });
});

