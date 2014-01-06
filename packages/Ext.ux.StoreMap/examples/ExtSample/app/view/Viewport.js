Ext.define('ExtSample.view.Viewport', {
    extend: 'Ext.container.Viewport',
    requires:[
        'Ext.layout.container.Fit',
        'ExtSample.view.Main',
	    'ExtSample.view.Map'
    ],

    layout: {
        type: 'fit'
    },

    items: [{
        xtype: 'Map'
    }]
});
