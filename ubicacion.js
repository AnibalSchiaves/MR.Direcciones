var ubicacionMR = new function() {
	
	this.suffix = "ubicacionMR"
	
	this.url_servicio_dir = "http://localhost:8080/ubicacion-ws/geojson/direcciones"; //"exampledir.json";
	this.url_servicio_lugares = "http://localhost/mapa/proxy.php?url=http://t-www.rosario.gov.ar/web/geojson-lugares";
	
	this.style_map_default = {'width': '50%', 'heigth': '400px', 'border': '1px #AAAAAA solid'};
	
	this.styleDraw = new ol.style.Style({
			  	fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.3)'
			  	}),
			  	stroke: new ol.style.Stroke({
					color: "#E95F38",
					width: 2
			  	}),
			  	/*image: new ol.style.Circle({
					radius: 7,
					fill: new ol.style.Fill({
				  		color: '#ffcc33'
					})
			  	}),*/
				image: new ol.style.Icon({
					src: 'img/boton-pin.png',
					scale: 0.6
				})
			});
	
	//El formato por defecto para el manejo de estructuras de datos geograficos
	this.format_default = 'geojson';
	
	this.validChar = function(keycode) {
		var valid = 
        (keycode > 47 && keycode < 58)   || // number keys
        keycode == 32 || /*keycode == 13   ||*/ // spacebar & return key(s) (if you want to allow carriage returns)
        (keycode > 64 && keycode < 91)   || // letter keys
        (keycode > 95 && keycode < 112)  || // numpad keys
        (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
		(keycode == 8) ||                   // backspace
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
		$("#"+control.id+"-ul").css("display","none");
		
	}
	
	this.procesarUbicacion = function (control, result) {
		$("#"+control.id+"-ul").empty();
		for (var i = 0;i<result.length;i++) {
			var hidden = JSON.stringify(result[i].geometry).replace(new RegExp('"', 'g'), "'");
			$("#"+control.id+"-ul").append('<li class="'+ubicacionMR.suffix+'-li" hidden-value="'+hidden+'">'+result[i].properties.name+'</li>')
		}
		$("#"+control.id+"-ul li").click(ubicacionMR.seleccionarUbicacion);
		$("#"+control.id+"-ul").css("display","block");
	}
	
	//Funciones de Posicionamiento
	this.centrarMapa = function(center,map) {
		var duration = 2000;
		var start = +new Date();
		var pan = ol.animation.pan({
			duration: duration,
			source: /** @type {ol.Coordinate} */ (map.getView().getCenter()),
			start: start
		});
		var bounce = ol.animation.bounce({
			duration: duration,
			resolution: 4 * map.getView().getResolution(),
			start: start
		});
		map.beforeRender(pan, bounce);
		map.getView().setCenter(center);
		map.getView().setZoom(15);
	}
	
	this.centrarMapaEnGeometry = function(geometry, map) {
		var duration = 2000;
		var start = +new Date();
		var pan = ol.animation.pan({
			duration: duration,
			source: /** @type {ol.Coordinate} */ (map.getView().getCenter()),
			start: start
		});
		var bounce = ol.animation.bounce({
			duration: duration,
			resolution: 1 * map.getView().getResolution(),
			start: start
		});
		map.beforeRender(pan, bounce);
		map.getView().fit(geometry, map.getSize(), {padding: [100, 100, 100, 100], constrainResolution: false});
	}
	
	//Temporales
	this.imagePin = new ol.style.Icon({
		src: 'img/boton-pin.png',
		scale: 0.6,
		offset: [0,20]
	});
	
	//Funciones para controles agregados
	this.createRadio = function(name,value) {
		var radio = document.createElement('input');
		radio.setAttribute('type', 'radio');
		radio.setAttribute('name', name);
		radio.setAttribute('value', value);
		return radio;
	}
	this.createLabel = function(text) {
		var label = document.createElement("label");
		label.innerHTML = text;
		return label;
	}
	this.cambiarControlDibujo = function(map, control, geofeatures, features) {
		
		var this_ = this;
		
        var setearTipoDibujo = function(type) {
			var interaction = null;
			map.getInteractions().forEach(function (intera) {if (intera.getProperties().id=='interactionDraw') {interaction = intera;}});
			map.removeInteraction(interaction);
			//map.getInteractions().clear();
			var vectorDraw = null;
			map.getLayers().forEach(function (lyr) {if (lyr.get('id')=='layerDraw') {vectorDraw = lyr;}});
			vectorDraw.setStyle(ubicacionMR.styleDraw);
			var draw = new ol.interaction.Draw({
					features: features,
					source: vectorDraw.getSource(),
					type: /** @type {ol.geom.GeometryType} */ type,
					/*geometryFunction: geometryFunction,
					maxPoints: maxPoints*/
				});
			draw.setProperties({'id':'interactionDraw'});
			var geojsonFeatures = geofeatures;
			draw.on('drawend',function(event) {
					geojsonFeatures = ubicacionMR.geojson.writeFeaturesInControl(event.feature,vectorDraw.getSource(),control);
				});
			map.addInteraction(draw);
				
        };
		
		var clearFeatures = function() {
			var vectorDraw = null;
			map.getLayers().forEach(function (lyr) {if (lyr.get('id')=='layerDraw') {vectorDraw = lyr;}});
			vectorDraw.getSource().clear();
			control.val('');
		}
		
        var labelPoint = ubicacionMR.createLabel("Punto");
		var radioPoint = ubicacionMR.createRadio("radioTypeDraw","Point");
		radioPoint.setAttribute('checked','checked');
		radioPoint.addEventListener('click', function() {setearTipoDibujo('Point')}, false);
		var labelLine = ubicacionMR.createLabel("Línea");
		var radioLine = ubicacionMR.createRadio("radioTypeDraw","LineString");
		radioLine.addEventListener('click', function() {setearTipoDibujo('LineString')}, false);
		var labelPoli = ubicacionMR.createLabel("Polígono");
		var radioPoli = ubicacionMR.createRadio("radioTypeDraw","Polygon");
		radioPoli.addEventListener('click', function() {setearTipoDibujo('Polygon')}, false);
		
        var element = document.createElement('div');
        element.className = ubicacionMR.suffix+'-control-typedraw ol-control';
		var div1 = document.createElement('div');
        div1.appendChild(radioPoint);
		div1.appendChild(labelPoint);
		element.appendChild(div1);
		var div2 = document.createElement('div');
		div2.appendChild(radioLine);
		div2.appendChild(labelLine);
		element.appendChild(div2);
		var div3 = document.createElement('div');
		div3.appendChild(radioPoli);
		div3.appendChild(labelPoli);
		element.appendChild(div3);
		var div4 = document.createElement('div');
		var buttonClear = document.createElement('button');
		buttonClear.addEventListener('click', function() {clearFeatures();return false;}, false);
		buttonClear.innerHTML='x';
		buttonClear.title = "Borrar todo";
		buttonClear.type = 'button';
		div4.appendChild(buttonClear);
		element.appendChild(div4);

        ol.control.Control.call(this, {
          element: element,
        });
	}
	ol.inherits(this.cambiarControlDibujo, ol.control.Control);
	
	//Funciones relacionadas al formto GeoJSON
	this.geojson = new function() {
		
		this.procesarUbicacion = function (control, result) {
			$("#"+control.id+"-ul").empty();
			if (result.type=='FeatureCollection') {
				ubicacionMR.geojson.procesarFeatureCollection(control, result);
			} else if (result.type=='Feature') {
				ubicacionMR.geojson.procesarFeature(control, result);
			} else {
				ubicacionMR.geojson.procesarGeometry(control, result);
			}
			$("#"+control.id+"-ul li").click(ubicacionMR.geojson.seleccionarUbicacion);
			$("#"+control.id+"-ul").css("display","block");
		}
		
		this.procesarFeatureCollection = function(control, object) {
			for (var i = 0;i<object.features.length;i++) {
				//var hidden = JSON.stringify(object.features[i].geometry).replace(new RegExp('"', 'g'), "'");
				var hidden = JSON.stringify(object.features[i]).replace(new RegExp('"', 'g'), "'");
				$("#"+control.id+"-ul").append('<li class="'+ubicacionMR.suffix+'-li" hidden-value="'+hidden+'">'+object.features[i].properties.name+'</li>');
			}
		}
		
		this.procesarFeature = function(control, object) {
			//var hidden = JSON.stringify(object.geometry).replace(new RegExp('"', 'g'), "'");
			var hidden = JSON.stringify(object).replace(new RegExp('"', 'g'), "'");
			$("#"+control.id+"-ul").append('<li class="'+ubicacionMR.suffix+'-li" hidden-value="'+hidden+'">'+object.properties.name+'</li>');
		}
		
		this.procesarGeometry = function(control, object) {
			var hidden = JSON.stringify(object).replace(new RegExp('"', 'g'), "'");
			var name = object.type;
			if (object.id) {
				name += "["+object.id+"]";
			}
			$("#"+control.id+"-ul").append('<li class="'+ubicacionMR.suffix+'-li" hidden-value="'+hidden+'">'+name+'</li>');
		}
		
		this.seleccionarUbicacion = function (element) {
			var control = $(element.currentTarget).parent().attr('control-rel');
			$("#"+control).val($(element.currentTarget).html());
			var hidden = $(element.currentTarget).attr('hidden-value');
			$("#"+control+"-hidden").val(hidden);
			hidden = hidden.replace(new RegExp("'", 'g'), '"');
			var geojson = JSON.parse(hidden);
			var idMapa = $(element.currentTarget).parent().attr('mapa-rel');
			if (idMapa!='') {
				var map = $('#'+idMapa).data('map');
				ubicacionMR.geojson.dibujarEnMapa(geojson,map);
				ubicacionMR.geojson.centrarMapa(geojson,map);
			}
			$("#"+control+"-ul").css("display","none");
		}
		
		this.writeFeaturesInControl = function(feature, source, control) {
			var geojsonFeatures = [];
			source.getFeatures().forEach(function (feature) {geojsonFeatures.push(feature);});
			if (feature)
				geojsonFeatures.push(feature);
			if (geojsonFeatures.length>1) {
				control.val((new ol.format.GeoJSON()).writeFeatures(geojsonFeatures));
			} else {
				control.val((new ol.format.GeoJSON()).writeFeature(geojsonFeatures[0]));
			}
			return geojsonFeatures;
		}
		
		this.dibujarEnMapa = function (object,map) {
			var features = [];
			if (object.type=='FeatureCollection') {
				features = (new ol.format.GeoJSON()).readFeatures(object);
				for (var i=0;i<object.features.length;i++) {
					var id = null;
					if (object.features[i].properties && object.features[i].properties.id) id = object.features[i].properties.id;
					if (id==null) id = JSON.stringify(object.features[i].geometry.coordinates);
					features[i].setId(id);
				}	
			} else if (object.type=='Feature') {
				//Obtengo el feature si existe
				var id = null;
				if (object.properties && object.properties.id) id = object.properties.id;
				if (id==null) id = JSON.stringify(object.geometry.coordinates);
				if (id!=null) {
					var vectorLayer = null;
					map.getLayers().forEach(function (lyr) {if (lyr.get('id')=='layerFeatures') {vectorLayer = lyr;}});
					if (vectorLayer != null) {
						if (vectorLayer.getSource().getFeatureById(id)!=null) {
							return;
						}
					}
				}
				features = (new ol.format.GeoJSON()).readFeatures(object);
				//Asigno id al feature
				if (features.length>0 && id!=null) {
					features[0].setId(id);
				}
			} else {
				var feature = new ol.Feature((new ol.format.GeoJSON()).readGeometry(object));
				features = [feature];
			}
			//Agregao las features al layer correspondientes
			if (features.length>0) {
				var vectorSource = new ol.source.Vector({
					features: features
				});
				var image = new ol.style.Circle({
					radius: 3,
					fill: new ol.style.Fill({
              			color: 'red'
            		}),	
					stroke: new ol.style.Stroke({color: 'red', width: 1})
				});
				var styles = {
					'Point': new ol.style.Style({
						image: image
					}),
					'MultiLineString': new ol.style.Style({
          				stroke: new ol.style.Stroke({
            				color: 'rgba(233,95,56, 0.5)', //"#E95F38",
            				width: 5
          				})
        			}),
					'MultiPolygon': new ol.style.Style({
          				stroke: new ol.style.Stroke({
            				color: 'yellow',
            				width: 3
          				}),
          				fill: new ol.style.Fill({
            				color: 'rgba(255, 255, 0, 0.3)'
          				})
        			})
				};
				/*var imagePin = new ol.style.Icon({
					src: 'img/boton-pin.png',
					scale: 0.6
				});*/
				var styleFunction = function(feature) {
					var geojson = (new ol.format.GeoJSON()).writeFeatureObject(feature);
					if (geojson.geometry && geojson.geometry.type && geojson.geometry.type == 'Point') {
						var iconStyle = new ol.style.Style({
							image: ubicacionMR.imagePin
						});
						feature.setStyle(iconStyle);
					}
					return styles[geojson.geometry.type];
				};
				var vectorLayer = null;
				map.getLayers().forEach(function (lyr) {if (lyr.get('id')=='layerFeatures') {vectorLayer = lyr;}});
				if (vectorLayer == null) {
					vectorLayer = new ol.layer.Vector({
						source: vectorSource,
						//style: styleFunction,
						style: ubicacionMR.styleDraw,
						id: 'layerFeatures',
					});
					map.addLayer(vectorLayer);
				} else {
					vectorLayer.getSource().addFeatures(features);
				}
			}
		}
		
		this.centrarMapa = function(object, map) {
			if (object) {
				if (object.type=='FeatureCollection') {

				} else if (object.type=='Feature') {
					ubicacionMR.geojson.centrarMapa(object.geometry,map);
				} else if (object.type=='GeometryCollection') {

				} else if (object.type=='Point') {
					ubicacionMR.centrarMapa(object.coordinates,map);
				} else {
					var feature = new ol.Feature((new ol.format.GeoJSON()).readGeometry(object));
					ubicacionMR.centrarMapaEnGeometry(feature.getGeometry(),map);
				}
			}
		}
		
	}
}

function UbicacionMR () {
	this.controlVisible = null;
	this.controlHidden = null;
	
	this.getValue = function() {
		return this.controlHidden.val();
	}
	
	this.getLabel = function() {
		return this.controlVisible.val();
	}
}

$.fn.ubicacionMR = function(param) {
	var respuesta = new UbicacionMR();
	respuesta.controlVisible = $(this);
	//Determino si el control tiene busqueda de lugares y/o direcciones
	var searchEnabled = true;
	if (param.sinBusqueda && param.sinBusqueda==true) {
		searchEnabled = false;
	}
	//Detemina la url que usará para las búsquedas
	var url = '';
	if (param.filtro) {
		if (param.filtro.clase=='direccion') {
			url = ubicacionMR.armarUrlDir(param);
		} else if (param.filtro.clase=='lugar') {
			url = ubicacionMR.armarUrlLugares(param);
		}
	} else {
		url = ubicacionMR.armarUrlDir(param);
	}
	//Determina el formato para la representación de las estructuras de datos geográficas
	var format = ubicacionMR.format_default;
	if (param.format) {
		format = param.format;
	}
	if (searchEnabled) {
		//Determina la función de procesamiento del resultado
		var procesar = function() {console.log('función de procesamiento por defecto.')}
		if (param.filtro) {
			if (param.filtro.clase=='direccion' || param.filtro.clase=='lugar') {
				if (format=='geojson') {
					procesar = ubicacionMR.geojson.procesarUbicacion;
				} else {
					procesar = ubicacionMR.procesarUbicacion;
				}
			}
		}
		//Determina la longitud mínima del texto para empezar a buscar
		var minLength = 3;
		if (param.minLength) {
			minLength = param.minLength;
		}
		//Define invocación a webservice en evento keyup 
		var timeInvocation = 0;
		this.keyup(function(event) {
			if ($(this).val().length>=minLength) {
				if (ubicacionMR.validChar(event.keyCode)) {
					var idLoading = "#"+this.id+"-loading";
					$(idLoading).css("display","inline");
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
							if (param.filtro.clase=='direccion' || param.filtro.clase=='lugar') {
								procesar(control,result);
							}
							$(idLoading).css("display","none");
						},
						error: function(result) {
							$("#"+this.id+"-loading").css("display","none");
							$(idLoading).css("display","none");
						}
					});
				}
			} else { //Si la longitud de la cadena es menor al minimo limpio la lista
				$("#"+this.id+"-ul").empty();
			}
			return this;
		});
		//Agrega los controles asociados al input del buscador (ubicacionMR-input, hidden, lista)
		$(this).addClass(ubicacionMR.suffix+'-input');
		$(this).after("<img src='img/loading.gif' class='"+ubicacionMR.suffix+"-loading' id='"+this[0].id+"-loading' />");
		$(this).after("<input class='"+ubicacionMR.suffix+"-hidden' id='"+this[0].id+"-hidden' type='hidden' value=''/>");
		respuesta.controlHidden = $("#"+this[0].id+"-hidden");
		var idMapa = "";
		if (param.mapa && param.mapa.id) {
			idMapa = param.mapa.id;
		}
		$(this).after("<ul class='"+ubicacionMR.suffix+"-ul' id='"+this[0].id+"-ul' control-rel='"+this[0].id+"' mapa-rel='"+idMapa+"' style='display:none;'></ul>");
	}
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
			  extent: extent,
			  zoom:12,
			})
		});
		var loadOnInit = false;
		if (param.mapa.cargarAlInicio) {
			if (param.mapa.features) {
				var dibujarEnMapa = function() {console.log('función de dibujo en mapa por defecto.')}
				if (format=='geojson') {
					dibujarEnMapa = ubicacionMR.geojson.dibujarEnMapa;
				}
				dibujarEnMapa(param.mapa.features,map);		
			} else {
				$.ajax({
					type: 'GET',
					url: url,
					contentType : "application/json; charset=utf-8",
					dataType: "json",
					data: {
						term: $(this).val()
					},
					success: function(result) {
						var control = respuesta.controlVisible;
						if (param.filtro.clase=='direccion' || param.filtro.clase=='lugar') {
							var dibujarEnMapa = function() {console.log('función de dibujo en mapa por defecto.')}
							if (format=='geojson') {
								dibujarEnMapa = ubicacionMR.geojson.dibujarEnMapa;
							}
							dibujarEnMapa(result,map);
						}
					},
					error: function(result) {
						console.log(result);
					}
				});
			}
		}
		//Defino posibilidad de dibujar en el mapa
		if (param.mapa.dibujar) {
			var source = new ol.source.Vector({wrapX: false});
			
			var type = '';
			var styleDraw = ubicacionMR.styleDraw;
			var controlDibujar = false;
			if (param.mapa.dibujar=='punto') {
				type = 'Point';
			} else if (param.mapa.dibujar=='línea' || param.mapa.dibujar=='linea') {
				type = 'LineString';
			} else if (param.mapa.dibujar=='poligono') {
				type = 'Polygon';
			} else if (param.mapa.dibujar=='todos') {
				type = 'Point';
				controlDibujar = true;
			}
			
			if (type!='') {
				var vectorDraw = new ol.layer.Vector({
					source: source,
					style: styleDraw,
					id:'layerDraw'
				});
				
				map.addLayer(vectorDraw);
				var features = new ol.Collection();
				var draw = new ol.interaction.Draw({
					features: features,
					source: source,
					type: /** @type {ol.geom.GeometryType} */ type,
					/*geometryFunction: geometryFunction,
					maxPoints: maxPoints*/
				});
				draw.setProperties({'id':'interactionDraw'});
				var control = $(this);
				var geojsonFeatures = [];
				draw.on('drawend',function(event) {
					geojsonFeatures = ubicacionMR.geojson.writeFeaturesInControl(event.feature,source,control);
				});
				map.addInteraction(draw);
				var modify = new ol.interaction.Modify({
					features: features,
					deleteCondition: function(event) {
					  return ol.events.condition.shiftKeyOnly(event) &&
						  ol.events.condition.singleClick(event);
					}
				  });
				modify.on('modifyend',function(event) {
					geojsonFeatures = ubicacionMR.geojson.writeFeaturesInControl(event.feature,source,control);
				});
				map.addInteraction(modify);
				if (controlDibujar) {
					map.getControls().extend([
						new ubicacionMR.cambiarControlDibujo(map, control, geojsonFeatures, features)
					]);
				}
			}
		}
		$('#'+param.mapa.id).data('map', map);
	}
	return respuesta;
}
