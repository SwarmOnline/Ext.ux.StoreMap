/**
 * ExtSample.view.Map
 */
Ext.define('ExtSample.view.Map', {

    extend: 'Ext.ux.StoreMap',

    alias: 'widget.Map',

    config: {
		mapCenter: {
			lat: 55.86298389566037,
			lng: -4.2524795532226
		},
	    mapOptions: {
		  zoom: 13
	    },
	    store: 'Markers',
	    groupMarkers: false
    },

    initialize: function(){
        this.callParent(arguments);

    }

});