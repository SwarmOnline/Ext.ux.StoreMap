/**
 * ExtSample.store.Markers
 */
Ext.define('ExtSample.store.Markers', {

    extend: 'Ext.data.Store',

	requires: [
		'ExtSample.model.Marker'
	],

    model: 'ExtSample.model.Marker',

    constructor: function(config){
        this.callParent(arguments);

	    this.loadData([
		    {
			    id: 1,
			    Lat: 55.87611408374344,
			    Lng: -4.3206577301025
		    },
		    {
			    id: 2,
			    Lat: 55.87537403246857,
			    Lng: -4.2939953804016
		    },
		    {
			    id: 3,
			    Lat: 55.85672397740231,
			    Lng: -4.2951645851135
		    }
	    ])
    }

});