var ubicacionMR = new function() {
	
	this.suffix = "ubicacionMR"
	
	this.url_servicio_dir = "http://localhost/MR.Direcciones/exampledir.json";
	this.url_servicio_lugares = "http://localhost/mapa/proxy.php?url=http://t-www.rosario.gov.ar/web/geojson-lugares";
	
	this.style_map_default = {'width': '50%', 'heigth': '400px', 'border': '1px solid'};
	
	this.validChar = function(keycode) {
		var valid = 
        (keycode > 47 && keycode < 58)   || // number keys
        keycode == 32 || /*keycode == 13   ||*/ // spacebar & return key(s) (if you want to allow carriage returns)
        (keycode > 64 && keycode < 91)   || // letter keys
        (keycode > 95 && keycode < 112)  || // numpad keys
        (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
        (keycode > 218 && keycode < 223);   // [\]' (in order)
		
		return valid;
	}
	
	this.armarUrlDir = function (param) {
		return ubicacionMR.url_servicio_dir;
	}
	
	this.armarUrlLugares = function (param) {
		var url = ubicacionMR.url_servicio_lugares;
		if (param.filtro.filtroclase) {
			if (param.filtro.filtroclase.tipo) {
				url += '/'+param.filtro.filtroclase.tipo;
			} else {
				url += '/0';
			}
			if (param.filtro.filtroclase.subtipo) {
				url += '/'+param.filtro.filtroclase.subtipo;
			} else {
				url += '/0';
			}
		}
		url += '&mode=native'; //QUITAR EN IMPLEMENTACIÓN DEFINITIVA
		return url;
	}
	
	this.seleccionarUbicacion = function (element) {
		var control = $(element.currentTarget).parent().attr('control-rel');
		$("#"+control).val($(element.currentTarget).html());
		$("#"+control+"-hidden").val($(element.currentTarget).attr('hidden-value'));
		console.log($(element.currentTarget).attr('hidden-value'));
		
	}
	
	this.procesarUbicacion = function (control, result) {
		$("#"+control.id+"-ul").empty();
		for (var i = 0;i<result.length;i++) {
			var hidden = JSON.stringify(result[i].geometry).replace(new RegExp('"', 'g'), "'");
			$("#"+control.id+"-ul").append('<li class="'+ubicacionMR.suffix+'-li" hidden-value="'+hidden+'">'+result[i].properties.name+'</li>')
		}
		$("#"+control.id+"-ul li").click(ubicacionMR.seleccionarUbicacion);
	}
	
}

$.fn.ubicacionMR = function(param) {
	//Detemina la url que usará para las búsquedas
	var url = '';
	if (param.filtro.clase=='direccion') {
		url = ubicacionMR.armarUrlDir(param);
	} else if (param.filtro.clase=='lugar') {
		url = ubicacionMR.armarUrlLugares(param);
	}
	//Determina la función de procesamiento del resultado
	var procesar = function() {console.log('función de procesamiento por defecto.')}
	if (param.filtro.clase=='direccion' || param.filtro.clase=='lugar') {
		procesar = ubicacionMR.procesarUbicacion;
	}
	//Determina la longitud mínima del texto para empezar a buscar
	var minLength = 3;
	if (param.minLength) {
		minLength = param.minLength;
	}
	//Define invocación a webservice en evento keyup 
	this.keyup(function(event) {
		if ($(this).val().length>=minLength) {
			if (ubicacionMR.validChar(event.keyCode)) {
				$.ajax({
					type: 'GET',
					url: url,
					contentType : "application/json; charset=utf-8",
					dataType: "json",
					data: {
						term: $(this).val()
					},
					success: function(result) {
						var control = event.currentTarget;
						if (param.filtro.clase=='direccion') {
							procesar(control,result);
						} else if (param.filtro.clase=='lugar') {
							procesar(control,result.features);
						}
					},
					error: function(result) {
						console.log(result);
					}
				});
			}
		} else { //Si la longitud de la cadena es menor al minimo limpio la lista
			$("#"+this.id+"-ul").empty();
		}
		return this;
	});
	//Agrega al control la clase ubicacionMR-input
	$(this).addClass(ubicacionMR.suffix+'-input');
	//Agrega hidden que almacena el valor real a guardar
	$(this).after("<input class='"+ubicacionMR.suffix+"-hidden' id='"+this[0].id+"-hidden' type='hidden' value=''/>");
	//Define la lista donde se mostrarán los elementos encontrados
	$(this).after("<ul class='"+ubicacionMR.suffix+"-ul' id='"+this[0].id+"-ul' control-rel='"+this[0].id+"'></ul>");
	//Crea e inicializa un mapa de OpenLayers si se solicita por parametro
	if (param.mapa && param.mapa.id) {
		
		var styleMapa = ubicacionMR.style_map_default;
		if (param.mapa.style) {
			styleMapa = param.mapa.style;
		}
		$("#"+param.mapa.id).css(styleMapa);
		
		proj4.defs("EPSG:22185","+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
		var extent = [5408191 , 6328836 , 5460856 , 6382958];
		var scales = [500, 1000, 2000, 4000, 10000, 25000, 50000, 75000, 100000, 150000, 200000];
		
		var map = new ol.Map({
			target: param.mapa.id,
			layers: [
			  new ol.layer.Tile({
				  source: new ol.source.TileWMS({
					  url: "http://infomapa.rosario.gov.ar/wms/planobase?",
					  params: {
						  'VERSION':'1.1.1',
						  'LAYERS':'distritos_descentralizados,rural_metropolitana,manzanas_metropolitana,limites_metropolitana,limite_municipio,sin_manzanas,manzanas,manzanas_no_regularizada,espacios_verdes,canteros,av_circunvalacion,avenidas_y_boulevares,sentidos_de_calle,via_ferroviaria,puentes,hidrografia,islas_del_parana,bancos_de_arena,autopistas,nombres_de_calles,numeracion_de_calles',
						  'format': 'image/jpeg', 
						  /*'srs': 'EPSG:22185', */
						  'map_imagetype': 'jpeg'
					  },
					  attributions: [new ol.Attribution({
						  html: "© Municipalidad de Rosario",
					  })],
				  }),
			  })
			],
			scales: scales,
			view: new ol.View({
			  projection:'EPSG:22185',
			  units: 'm',
			  center: ol.extent.getCenter(extent), //ol.proj.fromLonLat([x,y]), //ol.proj.transform([x, y], 'EPSG:4326', 'EPSG:22185'),
			  //center: ol.proj.fromLonLat([32,64]),
			  extent: extent,
			  /*resolutions: scales,
			  minResolution: scales[scales.length - 1], 
    		  maxResolution: scales[0], */
			  //resolution: scales[7], 
			  zoom:12,
			  //minScale: scales[scales.length - 1], 
    		  //maxScale: scales[0], 
			})
		});
	}
}
