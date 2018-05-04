/*global $*/

window.getTemplate = function getTemplate(tempalteName, locals) {
    locals = locals || {};
    var template = $('#template-' + tempalteName).get(0).content;
    var rootNode = $(template).clone();
    var superLocals = {};

    function updateView(varName) {
        (getSuperLocal(varName).viewUpdaters || []).forEach(function (fn) {
            fn();
        });
    }

    function getSuperLocal(varName) {
        if (superLocals[varName] && (superLocals[varName].getValue && superLocals[varName].setValue)) {
            return superLocals[varName];
        }
        var originalLocalValue = locals[varName];

        superLocals[varName] = superLocals[varName] || {viewUpdaters: []};

        if (typeof originalLocalValue === 'function') {
            superLocals[varName].getValue = locals[varName];
            superLocals[varName].setValue = function (v) {
                locals[varName](v);
                updateView(varName);
            };
            locals[varName] = function (v) {
                if (v === undefined) {
                    return originalLocalValue();
                }
                originalLocalValue(v);
                updateView(varName);
            };
        } else {

            superLocals[varName].getValue = function () {
                return originalLocalValue;
            };
            superLocals[varName].setValue = function (v) {
                originalLocalValue = v;
                updateView(varName);
            };
            Object.defineProperty(locals, varName, {
                get: superLocals[varName].getValue,
                set: superLocals[varName].setValue
            });
        }
        return superLocals[varName];
    }

    rootNode.find('[gt-bind]').each(function () {
        var node = $(this);
        var varName = node.attr('gt-bind');
        var tagName = node.get(0).tagName.toLowerCase();
        var supLocal = getSuperLocal(varName);
        supLocal.viewUpdaters = supLocal.viewUpdaters || [];

        if (['textarea', 'input', 'select'].indexOf(tagName) !== -1) {
            supLocal.viewUpdaters.push(function () {
                node.val(superLocals[varName].getValue());
            });
            node.bind('keyup', function () {
                var val = node.val();
                // we need to get it again in case it has been added
                supLocal = getSuperLocal(varName);
                if (val !== supLocal.getValue()) {
                    supLocal.setValue(val);
                }
            });
        } else {
            supLocal.viewUpdaters.push(function () {
                node.html(supLocal.getValue());
            });
        }

        updateView(varName);
    });

    rootNode.find('[gt-click]').bind('click', function (event) {
        event.preventDefault();
        var node = $(this);
        var varName = node.attr('gt-click');
        getSuperLocal(varName).setValue(event);
    });

    rootNode.find('[gt-show]').each(function () {
        var node = $(this);
        var varName = node.attr('gt-show');
        var supLocal = getSuperLocal(varName);
        var viewState = true;
        supLocal.viewUpdaters.push(function () {
            var varState = !!supLocal.getValue();
            if (varState === viewState) {
                return;
            }
            if (varState) {
                viewState = true;
                node.show();
            } else {
                viewState = false;
                node.hide();
            }
        });
        updateView(varName);
    });

    rootNode.find('[gt-hide]').each(function () {
        var node = $(this);
        var varName = node.attr('gt-hide');
        var supLocal = getSuperLocal(varName);
        var viewState = false;
        supLocal.viewUpdaters.push(function () {
            var varState = !!supLocal.getValue();
            if (varState === viewState) {
                return;
            }
            if (varState) {
                viewState = false;
                node.hide();
            } else {
                viewState = true;
                node.show();
            }
        });
        updateView(varName);
    });


    return rootNode;
};