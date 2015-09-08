/**
 * Pimcore
 *
 * LICENSE
 *
 * This source file is subject to the new BSD license that is bundled
 * with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.pimcore.org/license
 *
 * @copyright  Copyright (c) 2009-2014 pimcore GmbH (http://www.pimcore.org)
 * @license    http://www.pimcore.org/license     New BSD License
 */


pimcore.registerNS("pimcore.settings.user.workspace.document");
pimcore.settings.user.workspace.document = Class.create({

    initialize: function (parent) {
        this.parent = parent;

        if(typeof this.parent.data["user"] != "undefined") {
            this.data = this.parent.data.user;
        } else if(typeof this.parent.data["role"] != "undefined") {
            this.data = this.parent.data.role;
        }
    },

    getPanel: function () {

        var availableRights = ["list","view","save","publish","unpublish","delete","rename","create","settings",
                                                            "versions","properties"];
        var gridPlugins = [];
        var storeFields = ["path"];

        var typesColumns = [
            {header: t("path"), width: 200, sortable: false, dataIndex: 'path',
                    editor: new Ext.form.TextField({}),
                    css: "background: url(/pimcore/static/img/icon/drop-16.png) right 2px no-repeat;"}
        ];

        var check;
        for (var i=0; i<availableRights.length; i++) {

            // columns
            check = new Ext.grid.column.Check({
                header: t(availableRights[i]),
                dataIndex: availableRights[i],
                width: 50,
                flex: 1
            });

            typesColumns.push(check);
            gridPlugins.push(check);

            // store fields
            storeFields.push({name:availableRights[i], type: 'bool'});
        }

        typesColumns.push({
            xtype: 'actioncolumn',
            width: 30,
            items: [{
                tooltip: t('delete'),
                icon: "/pimcore/static/img/icon/cross.png",
                handler: function (grid, rowIndex) {
                    grid.getStore().removeAt(rowIndex);
                    this.updateRows();
                }.bind(this)
            }]
        });

        this.store = new Ext.data.JsonStore({
            autoDestroy: true,
            proxy: {
                type: 'memory',
                reader: {

                    rootProperty: 'workspacesDocument'
                }
            },
            fields: storeFields,
            data: this.data
        });

        this.cellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
            clicksToEdit: 1
        });

        this.grid = Ext.create('Ext.grid.Panel', {
            frame: false,
            autoScroll: true,
            store: this.store,
            columns : typesColumns,
            trackMouseOver: true,
            columnLines: true,
            stripeRows: true,
            autoExpandColumn: "path",
            autoHeight: true,
            style: "margin-bottom:20px;",
            plugins: [
                this.cellEditing
            ],
            tbar: [
                {
                    xtype: "tbtext",
                    text: "<b>" + t("documents") + "</b>"
                },
                "-","-",
                {
                    iconCls: "pimcore_icon_add",
                    text: t("add"),
                    handler: this.onAdd.bind(this)
                }
            ],
            viewConfig: {
                forceFit: true,
                listeners: {
                    rowupdated: this.updateRows.bind(this),
                    refresh: this.updateRows.bind(this)
                }
            }
        });

        this.store.on("update", this.updateRows.bind(this));
        this.grid.on("viewready", this.updateRows.bind(this));


        return this.grid;
    },

    updateRows: function () {

        var rows = Ext.get(this.grid.getEl().dom).query(".x-grid-row");

        for (var i = 0; i < rows.length; i++) {

            var dd = new Ext.dd.DropZone(rows[i], {
                ddGroup: "element",

                getTargetFromEvent: function(e) {
                    return this.getEl();
                },

                onNodeOver : function(target, dd, e, data) {
                    return Ext.dd.DropZone.prototype.dropAllowed;
                },

                onNodeDrop : function(myRowIndex, target, dd, e, data) {
                    try {
                        var record = data.records[0];
                        var data = record.data;

                        if(data.elementType != "document") {
                            return false;
                        }

                        var rec = this.grid.getStore().getAt(myRowIndex);
                        rec.set("path", data.path);

                        this.updateRows();

                        return true;
                    } catch (e) {
                        console.log(e);
                    }
                }.bind(this, i)
            });
        }

    },

    onAdd: function (btn, ev) {
        this.grid.store.insert(0, {
            path: ""
        });

        this.updateRows();
    },

    getValues: function () {

        var values = [];
        this.store.commitChanges();

        var records = this.store.getRange();
        for (var i = 0; i < records.length; i++) {
            var currentData = records[i];
            if (currentData) {
                    values.push(currentData.data);
            }
        }

        return values;
    }
});