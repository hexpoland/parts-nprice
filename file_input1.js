var code1,isreplace;
$(function() {
    $("#uszkodzony").bind('change', function() {
        if($(this).is(':checked')){
            App.setState('locator.halfSample','true');
            console.log('Zmiana na true')
        }else{
            App.setState('locator.halfSample','false');
            console.log('zmiana na false');
        }
    });
    $( ".thumbnails").on( "taphold",'.thumbnail',function(){
        if (confirm("Wysłać pozycje mailem?")==true) {
            window.location.href='mailto:?body='+$(this).children('.caption').text();
        }
        
    } );
    $('#exec').click(function() {
        /* Act on the event */
        $('.inputfile').click();
        App.setState('locator.patchSize','small'); //resetujemy wielkosc skanera
        $.mobile.loading( "show", {
            text: msgText,
            textVisible: textVisible,
            theme: theme,
            textonly: textonly,
            html: html
    });
        
    });
    $('#refresh').click(function() {
        /* Act on the event */
        $(".controls button").click();
    });
    
    $('#cennik1').load('cennik_rational.html');
    
    var sizes=['x-small','small','medium','large','x-large'];
    var patch='small';
    var wykryty=false;
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

            $(".controls input[type=file]").on("change", function(e) { //zrobienie zdiecia
                if (e.target.files && e.target.files.length) {
                    App.decode(URL.createObjectURL(e.target.files[0]));
                }
            });

            $(".controls button").on("click", function(e) {//refresh button
                var input = document.querySelector(".controls input[type=file]");
                if (input.files && input.files.length) {
                    App.decode(URL.createObjectURL(input.files[0]));
                    console.log(input.files[0])
                }
            });

            $(".controls1 .reader-config-group").on("change", "input, select", function(e) {  //sprawdzanie zmian w konfigu
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
            $(".controls1 .reader-config-group").off("change", "input, select");
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
                size: 1240
            },
            locator: {
                patchSize: patch, //medium narazie najlepsze wyniki w testach najlepiej zrobic w petli
                halfSample: false
            },
            numOfWorkers: 4,
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

        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;
        var found=false;
       
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
                found=true;
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3});
            }
            // opcja pierwsza do zmiany wielkosci
            if (!found) {
                var actsize=App.state.locator.patchSize;
                //App.setState('inputStream.size','1240');
                switch (actsize) {
                    case 'small':
                        App.setState('locator.patchSize','medium');
                        $('.controls button').click();
                        
                        break;
                    case 'medium':
                        
                        App.setState('locator.patchSize','large');
                        if(!found){
                            App.setState('inputStream.size','1400');
                            $('.controls button').click();

                            break;
                        }
                        $('.controls button').click();

                        break;
                    case 'large':
                        
                        App.setState('locator.patchSize','x-large');
                        $('.controls button').click();
                        break;
                    case 'x-large':
                        //$('#exec').click();
                        alert('Niepoprawne zdięcie');
                        App.setState('locator.patchSize','small');
                        break;

                    
                }
                // App.setState('locator.patchSize','medium');
                
                
                App.setState('inputStream.size','1240');
                



            }
        }
    //while
    //console.log('Wynik: '+result.codeResult.code)
    });
    
    Quagga.onDetected(function(result) {
        console.log('wykryto');
        App.setState('locator.patchSize','small');
        var code = result.codeResult.code,
            $node,
            canvas = Quagga.canvas.dom.image;
            console.log(code);
            code1=code;
            //moj kod
            var price=$('#cennik1').html();
            var temp=0;
            code=code.substring(0,code.length-1);
            if(code.match(/[.]$/g)){ //jezeli na koncu znajduje sie kropka
                code=code.substring(0,code.length-1); //to ja usun
                console.log('debug'+code);

             //tutaj poprawic i usuwac znaki ktore nigdy nie wystepuja
            }
            if(code.match(/[S]$/g)){ //jezeli na koncu znajduje sie 'S' np klapla wilgotnosci CPC
                code=code.substring(0,code.length-1); //to ja usun
                console.log('debug'+code);

             //tutaj poprawic i usuwac znaki ktore nigdy nie wystepuja
            }
            var number='number'
            while(number.length<18){
             //tutaj poprawic i usuwac znaki ktore nigdy nie wystepuja
            
            number=price.indexOf(code,temp);
            //jeżeli znaleziono lub nie
            if(number>-1){
            temp=number+code.length; //pomijamy znaleziony element
            var name=price.indexOf('<p class="calibre1">',temp);
            console.log('DEBUG:'+price.substring(number-35,number));
            if(!price.substring(number-35,number).match(/zastąpiono.*/g)){ //spraedzanie numeru czy jest poprawnym indexem
                number=price.substring(number,name);
                break;

            }
            number=price.substring(number,name);

            }else{
                number=code;
                break;
            }
            }//while

            var cena=price.indexOf('<p class="calibre1">',name+20);
            
            name=price.substring(name,cena);
            cena=price.substring(cena,price.indexOf('<p class="calibre1">',cena+20));
            
            //sprawdzanie czy numer nie jest zastapiony
            if(cena.match(/zastąpiono.* /g)){
                temp=0;
                var newcode,newprice,newnumber,newname;
                var newcode=cena.match(/zastąpiono.*/g).toString();
                newcode=newcode.match(/\d.*/g).toString();
                newcode=newcode.replace("</p>","");

                console.log('zastapiono przez '+newcode);
                //newnumber=price.indexOf(newcode,temp);
                newnumber='number';
                while(newnumber.length<16){   //dopuki nie znajdziemy numeru który jest poprawnym indexem czesci
             //tutaj poprawic i usuwac znaki ktore nigdy nie wystepuja
            
                newnumber=price.indexOf(newcode,temp);         
                if(newnumber>-1){     //jezeli znaleziono
                    temp=newnumber+newcode.length;
                    newname=price.indexOf('<p class="calibre1">',temp);
                    newnumber=price.substring(newnumber,newname);
                    }else{//jezeli nie znaleziono
                        newnumber=code;
                        break;
                    }
                }
                cena=price.indexOf('<p class="calibre1">',newname+20);
                cena=price.substring(cena,price.indexOf('<p class="calibre1">',cena+20));
                





            }//zastapiono warunek

            if(cena.match(/[0-9]+,+\d*/g)){  //sprawdzenie czy cena zawiera poprawna cene
                console.log(cena);
            }else{
                cena='';
            }

            console.log(number, name, cena);


            //moj kod

        $node = $('<li><div class="thumbnail"><div class="imgWrapper"><img /></div><div class="caption"><h5 class="code"></h4></div></div></li>');
        $node.find("img").attr("src", canvas.toDataURL());
        $node.find("h5.code").html(number+name+cena);
        $("#result_strip ul.thumbnails").prepend($node);
        wykryty=true;
        $.mobile.loading( "hide" );
        });
       
            
    
});

$( document ).on( "change", ".inputfile", function() {
    var $this = $( this ),
        theme = $this.jqmData( "theme" ) || $.mobile.loader.prototype.options.theme,
        msgText = $this.jqmData( "msgtext" ) || $.mobile.loader.prototype.options.text,
        textVisible = $this.jqmData( "textvisible" ) || $.mobile.loader.prototype.options.textVisible,
        textonly = !!$this.jqmData( "textonly" );
        html = $this.jqmData( "html" ) || "";
    $.mobile.loading( "show", {
            text: msgText,
            textVisible: textVisible,
            theme: theme,
            textonly: textonly,
            html: html
    });
})
                    
        

