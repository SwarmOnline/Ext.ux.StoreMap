/**
 * Ext.ux.StoreMap
 */
Ext.define('Ext.ux.StoreMap', {

    extend: 'Ext.ux.GMapPanel',

    alias: 'widget.storemap',

    config: {

	    /**
	     * @cfg {Ext.data.Store} store The store that contains the data records to have markers created for
	     */
	    store                       : null,

	    /**
	     * @cfg {String} latitudeField The field name of the store's model that contains the latitude information
	     */
	    latitudeField               : 'Lat',

	    /**
	     * @cfg {String} longitudeField The field name of the store's model that contains the longitude information
	     */
	    longitudeField              : 'Lng',

	    /**
	     * @cfg {String/Function} markerIcon The path to the image to be used as the marker. If a string is set then it will be used as the path, if a Function is used it will have the record passed in.
	     *
	     * For example,
	     *
	     * markerIcon: function(record){
	     *      return record.get('markerIcon');
	     * }
	     */
	    markerIcon                  : 'icon.png',

	    /**
	     * @cfg {String} currentLocationMarkerIcon The icon to use to display the user's current location
	     */
	    currentLocationMarkerIcon   : 'icon.png',

	    /**
	     * @cfg {Object} currentLocation An object containing a lat/lng to use as the user's current location
	     *
	     * For example:
	     *
	     * currentLocation: {
	     *      lat: 1,
	     *      lng: 1
	     * }
	     */
	    currentLocation             : null,

	    /**
	     * @cfg {Boolean} showCurrentLocationMarker True to display a marker based on the currentLocation
	     * value. This marker will be updated when the value of the currentLocation config is updated.
	     */
	    showCurrentLocationMarker   : true,

	    /**
	     * @cfg {Boolean} centreOnCurrentLocation This flag determines if the map should start off centred on the user's current location
	     */
	    centreOnCurrentLocation     : true,

	    /**
	     * @cfg {Object} defaultLocation If the centreOnCurrentLocation config is set to false then this object (in the format { lat: xxx, lng: xxx } ) will be used as the initial location of the map
	     */
	    defaultLocation             : {
		    lat: '',
		    lng: ''
	    },

	    /**
	     * @cfg {Boolean} groupMarkers True if you would like to use Google Map's Marker Clustering to group markers so there aren't as many on screen at once. If enabling this ensure you have the code included in your page from http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/
	     */
	    groupMarkers                : true,

	    // private
	    markers                     : null,

	    // private
	    currentLocationMarker       : null,

	    // private
	    overlayView                 : null
    },

	storeEventHooks: {
		beforeload: 'onBeforeLoad',
		load: 'onLoad',
		refresh: 'refresh',
		add: 'onStoreAdd',
		remove: 'onStoreRemove',
		update: 'onStoreUpdate'
	},

	constructor: function(config){
		this.callParent(arguments);

		this.initConfig(config);
	},

    initComponent: function(){
	    var me = this;

	    this.on({
		    mapready: this.onMapRender,
		    scope: this
	    });

        this.callParent(arguments);

	    if (me.getStore()) {
		    if (me.getMap()) {
			    me.refresh();
		    }
		    else {
			    me.on({
				    mapready: 'refresh',
				    single: true
			    });
		    }
	    }
    },

	/**
	 * Handler for the maprender event.
	 * This is used to create an OverlayView and to attach map events.
	 * @method
	 * @private
	 * @param {Ext.ux.StoreMap} map
	 */
	onMapRender: function(map){
		var me = this,
			overlay = new google.maps.OverlayView();

		overlay.draw = function() {};
		overlay.setMap(map.getMap());

		this.setOverlayView(overlay);

		google.maps.event.addListener(this.getMap(), 'dragstart', Ext.bind(this.onMapClick, this));
		google.maps.event.addListener(this.getMap(), 'click', Ext.bind(this.onMapClick, this));
	},

	onBeforeLoad: Ext.emptyFn,
	onLoad: Ext.emptyFn,

	/**
	 * Handler for the Google Map's click event.
	 * This raises the 'mapclick' event on the StoreMap itself.
	 * @method
	 * @private
	 * @param e
	 */
	onMapClick: function(e){
		this.fireEvent('maptap', this, e);
	},

	/**
	 * Refreshes the Map and its markers
	 * @method
	 * @public
	 */
	refresh: function(){
		var me = this;

		if (!this.getMap()) {
			this.un('mapready', 'refresh', this);
			this.on('mapready', 'refresh', this, { delay: 150, single: true });
		} else {
			//me.fireAction('refresh', [me], 'doRefresh');
			this.doRefresh(me);
		}

	},

	applyStore: function(store) {
		var me = this,
			bindEvents = Ext.apply({}, me.storeEventHooks, { scope: me }),
			proxy, reader;

		if (store) {
			store = Ext.data.StoreManager.lookup(store);
			if (store && Ext.isObject(store) && store.isStore) {
				store.on(bindEvents);
				proxy = store.getProxy();
				if (proxy) {
					reader = proxy.getReader();
					if (reader) {
						reader.on('exception', 'handleException', this);
					}
				}
			}
			//<debug warn>
			else {
				Ext.Logger.warn("The specified Store cannot be found", this);
			}
			//</debug>
		}

		return store;
	},

	/**
	 * Method called when the Store's Reader throws an exception
	 * @method handleException
	 */
	handleException: function() {
		this.setMasked(false);
	},

	updateStore: function(newStore, oldStore) {
		var me = this,
			bindEvents = Ext.apply({}, me.storeEventHooks, { scope: me }),
			proxy, reader;

		if (oldStore && Ext.isObject(oldStore) && oldStore.isStore) {
			me.onStoreClear();
			if (oldStore.getAutoDestroy()) {
				oldStore.destroy();
			}
			else {
				oldStore.un(bindEvents);
				proxy = oldStore.getProxy();
				if (proxy) {
					reader = proxy.getReader();
					if (reader) {
						reader.un('exception', 'handleException', this);
					}
				}
			}
		}

		if (newStore) {
			/*
			if (newStore.isLoaded()) {
				this.hasLoadedStore = true; // TODO
			}
			*/

			if (newStore.isLoading()) {
				//me.onBeforeLoad();
			}

			if(!this.getMap()) {
				this.un('mapready', 'refresh', this);
				this.on('mapready', 'refresh', this, { delay: 150, single: true });
			} else {
				this.refresh();
			}
		}
	},

	/**
	 * Returns the Ext.util.MixedCollection of Marker instances
	 * @method
	 * @private
	 * @returns {Ext.util.MixedCollection}
	 */
	getMarkers: function(){
		if(!this.markers){
			this.setMarkers(Ext.create(Ext.util.MixedCollection));
		}

		return this.markers;
	},

	/**
	 * Returns the marker icon path either from the markerIcon config value or by executing the function
	 * contained in the function.
	 * @param {Ext.data.Model} record The model to get the marker icon for. Passed into the markerIcon function if present
	 * @returns {string} The Marker Icon path
	 */
	getMarkerIconPath: function(record){
		var markerIcon = this.getMarkerIcon();

		if(Ext.isFunction(markerIcon)){
			markerIcon = markerIcon.call(this, record);
		}

		return markerIcon;
	},

	/**
	 * Updater for the showCurrentLocationMarker config.
	 * If we are setting this value to true then we want to create a new marker based on the current location value.
	 * @method
	 * @private
	 * @param {Boolean} val
	 */
	updateShowCurrentLocationMarker: function(val){
		if(val){
			this.updateCurrentLocation(this.getCurrentLocation());
		}
	},

	/**
	 * Updater for the currentLocation config.
	 * This will update the displayed current location marker
	 * @method
	 * @private
	 * @param {Object} location
	 * @param {Object} oldLocation
	 */
	updateCurrentLocation: function(location, oldLocation){

		if (!this.getMap()) {
			//this.un('mapready', 'doUpdateCurrentLocation', this);
			this.on('mapready', 'doUpdateCurrentLocation', this, { delay: 150, single: true, args: [location] });
		} else {
			this.doUpdateCurrentLocation(location);
		}

	},

	/**
	 * Performs the update on the CurrentLocation config option.
	 * This logic is extracted out so it can be attached to a 'mapready' event if the map isn't ready
	 * yet or executed immediately if the map is ready.
	 * @method
	 * @private
	 * @param {Object} location
	 */
	doUpdateCurrentLocation: function(location){
var hasLoc = location && location.lat && location.lng;
		if(hasLoc && this.getShowCurrentLocationMarker()){
			var val = this.createCurrentLocationMarker(location.lat, location.lng);
			this.setCurrentLocationMarker(val);
		}

		if(hasLoc && this.getCentreOnCurrentLocation()){
			this.panToCurrentLocation();
		}
	},

	/**
	 * Moves the map to centre on the map's 'currentLocation' value.
	 * @method
	 * @public
	 */
	panToCurrentLocation: function(){
		var location = this.getCurrentLocation(),
			latLngLocation = this.getGMLocation(location.lat, location.lng);

		this.setMapCenter(latLngLocation);
	},


	/**
	 * Updater for the 'centreOnCurrentLocatio' config.
	 * If false this will centre the map on the 'defaultLocation' value.
	 * @method
	 * @private
	 * @param {Boolean} val
	 */
	updateCentreOnCurrentLocation: function(val){
		if(val === false){
			if (!this.getMap()) {
				this.un('mapready', 'doCentreOnDefaultLocation', this);
				this.on('mapready', 'doCentreOnDefaultLocation', this, { delay: 150, single: true });
			} else {
				this.doCentreOnDefaultLocation();
			}
		}
	},

	/**
	 * Updates the map's centre to the lat/lng in the 'defaultLocation' config.
	 * This is called by the updateCentreOnCurrentLocation' method after the map has rendered.
	 * @method
	 * @private
	 */
	doCentreOnDefaultLocation: function(){
		var location        = this.getDefaultLocation();

		if(location.lat && location.lng){

			var latLngLocation  = this.getGMLocation(location.lat, location.lng);

			this.setMapCenter(latLngLocation);
		}
	},

	/**
	 * Updater for the currentLocationMarker config.
	 * This will remove the old marker if it exists - we do this afterwards so it doesn't flicker if it's in the same place.
	 * @method
	 * @private
	 * @param {Object} val
	 * @param {Object} oldVal
	 */
	updateCurrentLocationMarker: function(val, oldVal){
		if(oldVal){
			this.removeMarker(oldVal);
		}
	},

	/**
	 * Creates a marker at the specified lat/lng using the Current Location icon.
	 * @method
	 * @private
	 * @param {Float} lat
	 * @param {Float} lng
	 * @returns {Object} The created marker instance
	 */
	createCurrentLocationMarker: function(lat, lng){
		var latLngLocation = this.getGMLocation(lat, lng);

		var marker = new google.maps.Marker({
			position    : latLngLocation,
			map         : this.getMap(),
			icon        : this.getCurrentLocationMarkerIcon()
		});

		return marker;
	},

	/**
	 * Handler for a click event on one of the map's markers.
	 * This raises the 'markertap' event on the StoreMap itself and passes along
	 * the POI record and marker objects. These items are bound to the function (using Ext.bind) when attached.
	 * @method
	 * @private
	 * @param e
	 * @param {Ext.data.Model} record
	 * @param {google.Marker} marker
	 */
	onMarkerTap: function(e, record, marker){

		this.fireEvent('markertap', this, record, marker, e);
	},

	/**
	 * Retrieves the specified marker's pixel location on the screen.
	 * @method
	 * @public
	 * @param {google.Marker} marker
	 * @returns {Object} An object with an x and y property containing the pixel location of the marker
	 */
	getMarkerPixelPosition: function(marker){
		var proj    = this.getOverlayView().getProjection(),
			pos     = marker.getPosition();

		return proj.fromLatLngToContainerPixel(pos);
	},

	/**
	 * Performs the refresh logic.
	 * @method
	 * @private
	 * @param me
	 */
	doRefresh: function(me) {
		var store = me.getStore(),
			records = store.getRange();

		// remove all existing markers
		this.clearMarkers();

		// create new markers for the store's records
		this.createMarkers(records);
	},

	destroy: function() {
		var store = this.getStore();
		if (store && store.getAutoDestroy()) {
			store.destroy();
		}

		this.clearMarkers();
		
		this.callParent(arguments);
	},

	onStoreClear: function() {
		this.clearMarkers();
	},

	/**
	 * @private
	 * @param store
	 * @param records
	 */
	onStoreAdd: function(store, records) {
		if (records && this.getMap()) {
			this.createMarkers(records);
		}
	},

	/**
	 * @private
	 * @param store
	 * @param records
	 * @param indices
	 */
	onStoreRemove: function(store, records, indices) {
		var ln = records.length,
			i;
		for (i = 0; i < ln; i++) {
			this.removeMarkerByRecord(records[i]);
		}
	},

	/**
	 * @private
	 * @param store
	 * @param record
	 * @param {Number} newIndex
	 * @param {Number} oldIndex
	 */
	onStoreUpdate: function(store, record, newIndex, oldIndex) {
		this.updateMarker(record);
	},

	/**
	 * Creates a new map marker for each of the records passed in
	 * @method
	 * @private
	 * @param {Ext.data.Model[]} records
	 */
	createMarkers: function(records){
		var i = 0,
			l = records.length,
			markers = this.getMarkers(),
			rec;

		for(; i < l; i++){
			rec = records[i];

			if(!Ext.isEmpty(rec.get(this.getLatitudeField())) && !Ext.isEmpty(rec.get(this.getLongitudeField()))){
				markers.add(rec.getId(), this.createMarker(rec));
			} else {
				console.log('Record has no location information');
			}
		}

		if(this.getGroupMarkers()){
			var markerCluster = new MarkerClusterer(this.getMap(), markers.items);
		}
	},

	/**
	 * Creates a single Map marker from the specified record
	 * @method
	 * @private
	 * @param {Ext.data.Model} record
	 * @returns {Object} marker The created Google Maps marker
	 */
	createMarker: function(record){
		var lat     = record.get(this.getLatitudeField()),
			lng     = record.get(this.getLongitudeField()),
			icon    = this.getMarkerIconPath(record);

		var latLngLocation = this.getGMLocation(lat, lng);

		var marker = new google.maps.Marker({
			position    : latLngLocation,
			map         : this.getGroupMarkers() ? null : this.getMap(),
			icon        : icon
		});

		google.maps.event.addListener(marker, 'click', Ext.bind(this.onMarkerTap, this, [record, marker], true));

		return marker;
	},

	/**
	 * 'Refreshes' the position and icon of the marker representing the passed in record.
	 * @method
	 * @private
	 * @param {Ext.data.Model} record
	 */
	updateMarker: function(record){
		var marker = this.getMarkerByRecord(record),
			lat     = record.get(this.getLatitudeField()),
			lng     = record.get(this.getLongitudeField());

		if(marker){
			var latLng = this.getGMLocation(lat, lng);

			marker.setPosition(latLng);

			marker.setIcon(this.getMarkerIconPath(record));
		}
	},

	/**
	 * Removes all markers
	 * @method
	 * @public
	 */
	clearMarkers: function(){
		this.getMarkers().each(function(marker){
			this.removeMarker(marker);
		}, this);

		this.getMarkers().clear();
	},

	/**
	 * Removes a marker representing the passed in record
	 * @method
	 * @private
	 * @param {Ext.data.Model} record
	 */
	removeMarkerByRecord: function(record){
		var marker  = this.getMarkerByRecord(record);

		if(marker){
			this.removeMarker(marker);
		}
	},

	/**
	 * Performs the marker removal
	 * @method
	 * @private
	 * @param marker
	 */
	removeMarker: function(marker){

		google.maps.event.clearInstanceListeners(marker);

		marker.setMap(null);

		// remove from the Markers collection
		this.getMarkers().remove(marker);
	},

	/**
	 * Returns the Map marker representing the passed in record
	 * @method
	 * @private
	 * @param {Ext.data.Model} record
	 * @returns {Object}
	 */
	getMarkerByRecord: function(record){
		var id      = record.getId(),
			markers = this.getMarkers();

		return markers.getByKey(id);
	},

	/**
	 * Returns a record that is represented by the specified Marker.
	 * @method
	 * @private
	 * @param {Object} marker
	 * @returns {Ext.data.Model}
	 */
	getRecordByMarker: function(marker){
		var markers         = this.getMarkers(),
			indexOfMarker   = markers.indexOf(marker),
			recordID        = markers.keys[indexOfMarker];

		return this.getStore().getById(recordID);
	},

	getGMLocation: function(lat, lng){
		return new google.maps.LatLng(lat, lng);
	},

	getMap: function(){
		return this.gmap;
	}
});