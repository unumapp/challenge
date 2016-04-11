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

        sobel = function() {
          runFilter('sobel', function(px) {
            px = Filters.grayscale(px);
            var vertical = Filters.convoluteFloat32(px,
              [-1,-2,-1,
                0, 0, 0,
                1, 2, 1]);
            var horizontal = Filters.convoluteFloat32(px,
              [-1,0,1,
               -2,0,2,
               -1,0,1]);
            var id = Filters.createImageData(vertical.width, vertical.height);
            for (var i=0; i<id.data.length; i+=4) {
              var v = Math.abs(vertical.data[i]);
              id.data[i] = v;
              var h = Math.abs(horizontal.data[i]);
              id.data[i+1] = h
              id.data[i+2] = (v+h)/4;
              id.data[i+3] = 255;
            }
            return id;
          });
        }

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