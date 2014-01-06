/**
 * ExtSample.model.Marker
 */
Ext.define('ExtSample.model.Marker', {

    extend: 'Ext.data.Model',

    fields: [
        {
            name: 'Lat',
            type: 'float'
        },
	    {
            name: 'Lng',
            type: 'float'
        }
    ]
});