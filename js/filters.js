
      function handleFileSelect(evt) {
        var files = evt.target.files; // FileList object

        // Loop through the FileList and render image files as thumbnails.
        for (var i = 0, f; f = files[i]; i++) {

          // Only process image files.
          if (!f.type.match('image.*')) {
            continue;
          }

          var reader = new FileReader();

          // Closure to capture the file information.
          reader.onload = (function(theFile) {
            return function(e) {
              // Render thumbnail.
              var pre = document.getElementById('upload-image');
              // load image into the canvas
              if (!pre) //if no existing image create a new tag
              {
                var span = document.createElement('span');
                span.setAttribute("id", "upload-image");
                span.innerHTML = ['<img id="orig" class="thumb" style="display: none;" src="', e.target.result,
                                  '" title="', escape(theFile.name), '"/>'].join('');
                console.log(document.getElementById('list').insertBefore(span, null));
              }
              else  //else replace with the new image
              {
                document.getElementById('orig').outerHTML='';
                var span = document.createElement('span');
                span.setAttribute("id", "upload-image");
                span.innerHTML = ['<img id="orig" class="thumb" style="display: none;" src="', e.target.result,
                                  '" title="', escape(theFile.name), '"/>'].join('');
                document.getElementById('list').replaceChild(span, document.getElementById('upload-image'));
              }
              document.getElementById("filter_name").innerHTML = "original";

              var img = document.getElementById('orig');
              console.log(img.naturalWidth);

              //update the canvas
              img.addEventListener('load', function() {
                var canvases = document.getElementsByTagName('canvas');

                var c = canvases[0];
                var i = img.cloneNode(true);
                i.style.display = "inline";
                c.parentNode.insertBefore(i, c);
                c.style.display = 'none';

                //apply's the filters and updates the canvas 
                function runFilter(id, filter, arg1, arg2, arg3) {
                  var c = document.getElementById('grayscale');

                  var s = c.previousSibling.style;
                  var idata = Filters.filterImage(filter, img, arg1, arg2, arg3);
                  c.width = idata.width;
                  c.height = idata.height;
                  var ctx = c.getContext('2d');
                  ctx.putImageData(idata, 0, 0);
                  s.display = 'none';
                  c.style.display = 'inline';
                }

                // restore's the original image
                orign = function(){
                  document.getElementById("filter_name").innerHTML = "original";
                  var c = document.getElementById('grayscale');

                  var s = c.previousSibling.style;
                  var b = c.parentNode.getElementsByTagName('button')[0];
                  
                  if (s.display == 'none') {
                    s.display = 'inline';
                    c.style.display = 'none';
                    // b.textContent = b.originalText;
                  } 
                }

                //apply's grayscale filter
                grayscale = function() {
                   document.getElementById("filter_name").innerHTML = "grayscale";
                  runFilter('grayscale', Filters.grayscale);
                }

                //apply's negative filter
                negative = function() {
                   document.getElementById("filter_name").innerHTML = "negative";
                  runFilter('negative', Filters.negative, 40);
                }

                //apply's saturate filter
                saturate = function() {
                   document.getElementById("filter_name").innerHTML = "saturate";
                  runFilter('saturate', Filters.saturate, 128);
                }

                //apply's sharpen filter
                sharpen = function() {
                   document.getElementById("filter_name").innerHTML = "sharpen";
                  runFilter('sharpen', Filters.convolute,
                    [ 0, -1,  0,
                     -1,  5, -1,
                      0, -1,  0]);
                }

                //apply's blur filter
                blurC = function() {
                                 runFilter('blurC', Filters.convolute,
                                   [ 1/9, 1/9, 1/9,
                                     1/9, 1/9, 1/9,
                                     1/9, 1/9, 1/9 ]);
                               }

                //apply's sepia color tone
                sepia = function() {
                   document.getElementById("filter_name").innerHTML = "sepia";
                  runFilter('sepia', Filters.sepia);
                }

                //apply's random filters to images
                setInterval(function() {
                  console.log("hello");
                  var filters_list = [grayscale, saturate, negative, sepia, blurC, sharpen]
                  if (document.getElementById("random").checked){
                    var rand = Math.floor(Math.random() * 6)
                    filters_list[rand]();
                    console.log(rand);
                  }
                }, 2000);

              }, false);
            };
          })(f);

          // Read in the image file as a data URL.
          reader.readAsDataURL(f);
        }
      }

      document.getElementById('files').addEventListener('change', handleFileSelect, false);

        //this named array contains math
        //implementation of all the filters
        Filters = {};

        Filters.getPixels = function(img) {
          var c,ctx;
          if (img.getContext) {
            c = img;
            try { ctx = c.getContext('2d'); } catch(e) {}
          }
          if (!ctx) {
            c = this.getCanvas(img.naturalWidth, img.naturalHeight);
            ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0);
          }
          return ctx.getImageData(0,0,c.width,c.height);
        };

        Filters.getCanvas = function(w,h) {
          var c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          return c;
        };

        Filters.filterImage = function(filter, image, var_args) {
          var args = [this.getPixels(image)];
          for (var i=2; i<arguments.length; i++) {
            args.push(arguments[i]);
          }
          return filter.apply(null, args);
        };

        Filters.grayscale = function(pixels, args) {
          var d = pixels.data;
          for (var i=0; i<d.length; i+=4) {
            var r = d[i];
            var g = d[i+1];
            var b = d[i+2];
            // CIE luminance for the RGB
            var v = 0.2126*r + 0.7152*g + 0.0722*b;
            d[i] = d[i+1] = d[i+2] = v
          }
          return pixels;
        };

        Filters.sepia = function(pixels, args) {
          var d = pixels.data;
          for (var i=0; i<d.length; i+=4) {
            var r = d[i];
            var g = d[i+1];
            var b = d[i+2];
            // CIE luminance for the RGB
            d[i] = r * .393 + g *.769 + b * .189;
            d[i+1] = r * .349 + g *.686 + b * .168;
            d[i+2] = r * .272 + g *.534 + b * .131;
          }
          return pixels;
        };

        Filters.negative = function(pixels, adjustment) {
          var d = pixels.data;
          for (var i=0; i<d.length; i+=4) {
            d[i] = 255 - d[i] ;
            d[i+1] = 255 - d[i+1] ;
            d[i+2] = 255 - d[i+2] ;
          }
          return pixels;
        };

        Filters.saturate = function(pixels, saturate) {
          value = 1;
          var d = pixels.data;
          for (var i=0; i<d.length; i+=4) {
            var r = d[i];
            var g = d[i+1];
            var b = d[i+2];
            var gray = 0.2989*r + 0.5870*g + 0.1140*b; //weights from CCIR 601 spec
            d[i] = -gray * value + d[i] * (1+value);
            d[i+1] = -gray * value + d[i+1] * (1+value);
            d[i+2] = -gray * value + d[i+2] * (1+value);
            //normalize over- and under-saturated values
            if(d[i] > 255) d[i] = 255;
            if(d[i+1] > 255) d[i] = 255;
            if(d[i+2] > 255) d[i] = 255;
            if(d[i] < 0) d[i] = 0;
            if(d[i+1] < 0) d[i] = 0;
            if(d[i+2] < 0) d[i] = 0;
        }
        return pixels;
        };

        Filters.tmpCanvas = document.createElement('canvas');
        Filters.tmpCtx = Filters.tmpCanvas.getContext('2d');

        Filters.createImageData = function(w,h) {
          return this.tmpCtx.createImageData(w,h);
        };

        Filters.convolute = function(pixels, weights, opaque) {
          var side = Math.round(Math.sqrt(weights.length));
          var halfSide = Math.floor(side/2);

          var src = pixels.data;
          var sw = pixels.width;
          var sh = pixels.height;

          var w = sw;
          var h = sh;
          var output = Filters.createImageData(w, h);
          var dst = output.data;

          var alphaFac = opaque ? 1 : 0;

          for (var y=0; y<h; y++) {
            for (var x=0; x<w; x++) {
              var sy = y;
              var sx = x;
              var dstOff = (y*w+x)*4;
              var r=0, g=0, b=0, a=0;
              for (var cy=0; cy<side; cy++) {
                for (var cx=0; cx<side; cx++) {
                  var scy = Math.min(sh-1, Math.max(0, sy + cy - halfSide));
                  var scx = Math.min(sw-1, Math.max(0, sx + cx - halfSide));
                  var srcOff = (scy*sw+scx)*4;
                  var wt = weights[cy*side+cx];
                  r += src[srcOff] * wt;
                  g += src[srcOff+1] * wt;
                  b += src[srcOff+2] * wt;
                  a += src[srcOff+3] * wt;
                }
              }
              dst[dstOff] = r;
              dst[dstOff+1] = g;
              dst[dstOff+2] = b;
              dst[dstOff+3] = a + alphaFac*(255-a);
            }
          }
          return output;
        };

        if (!window.Float32Array)
          Float32Array = Array;

        Filters.convoluteFloat32 = function(pixels, weights, opaque) {
          var side = Math.round(Math.sqrt(weights.length));
          var halfSide = Math.floor(side/2);

          var src = pixels.data;
          var sw = pixels.width;
          var sh = pixels.height;

          var w = sw;
          var h = sh;
          var output = {
            width: w, height: h, data: new Float32Array(w*h*4)
          };
          var dst = output.data;

          var alphaFac = opaque ? 1 : 0;

          for (var y=0; y<h; y++) {
            for (var x=0; x<w; x++) {
              var sy = y;
              var sx = x;
              var dstOff = (y*w+x)*4;
              var r=0, g=0, b=0, a=0;
              for (var cy=0; cy<side; cy++) {
                for (var cx=0; cx<side; cx++) {
                  var scy = Math.min(sh-1, Math.max(0, sy + cy - halfSide));
                  var scx = Math.min(sw-1, Math.max(0, sx + cx - halfSide));
                  var srcOff = (scy*sw+scx)*4;
                  var wt = weights[cy*side+cx];
                  r += src[srcOff] * wt;
                  g += src[srcOff+1] * wt;
                  b += src[srcOff+2] * wt;
                  a += src[srcOff+3] * wt;
                }
              }
              dst[dstOff] = r;
              dst[dstOff+1] = g;
              dst[dstOff+2] = b;
              dst[dstOff+3] = a + alphaFac*(255-a);
            }
          }
          return output;
        };
 

