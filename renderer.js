// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const xprop = require('xprop');
const i3 = require('i3').createClient();
const dom = require('dom-tree')

let counter = 0;

i3.on('workspace', function(w) {
    dom.replace('#container', '#data', '<div id="data">{counter}\n{data}</div>', {
      	counter: counter,
      	data: w.change
    });
    console.log(w);
    counter++;

    xprop({
        prop: '_NET_WM_ICON',
        id: w.current.nodes[0].window
        },
        function(err,properties){
            if (err == null)
                console.log(properties);
            else
                console.log(err);
    })
});


cb = function() {
    // arguments[0] is null for some reason
    console.log(arguments[1]);
}


function get_window_structure() {
	let tree = i3.get_tree();

	focused_id = tree.find_focused().id;
	data = [];
	for (workspace in tree.workspaces()) {
		data_leave = [];
		for (leave in workspace.leaves()) {
			data_leave.append({
				id : leave.id,
				name : leave.name
			});
		}
	}
}


// def rename_workspaces(i3):
//     global show_window_title
//     ws_infos = i3.get_workspaces()
    
//     for ws_index, workspace in enumerate(i3.get_tree().workspaces()):
//         ws_info = ws_infos[ws_index]
//         focused_id = i3.get_tree().find_focused().id

//         name_parts = parse_workspace_name(workspace.name)
//         text = "<span font_desc='Droid Sans Mono Slashed 11' rise='2000'>%s:</span> " % name_parts['num']

//         for w in workspace.leaves():
//             text += "<span font_desc='fontawesome 15'>%s</span> " % icon_for_window(w)
//             if show_window_title and w.id == focused_id:
//                 text += "<span font_desc='Droid Sans Mono Slashed 11' rise='2000'>%s</span>" % w.name

//         name_parts['icons'] = text

//         new_name = construct_workspace_name(name_parts)
//         i3.command('rename workspace "%s" to "%s"' % (workspace.name, new_name))