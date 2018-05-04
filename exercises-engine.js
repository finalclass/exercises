/*global $*/
$(function () {
    function getCurrentExerciseSetName() {
        var hash = window.location.hash;
        return hash.substr(1);
    }

    function loadExerciseSet(setName) {
        return $.getJSON({url: '/exercises/' + setName + '.json'});
    }

    function getMainContentNode() {
        return $('#main-content');
    }

    function getTemplate(tempalteName, locals) {
        locals = locals || {};
        var template = $('#template-' + tempalteName).get(0).content;
        var rootNode = $(template).clone();
        var viewState = {};

        Object.keys(locals).forEach(function (varName) {
            var getValue;
            var setValue;
            var originalLocalValue = locals[varName];
            if (typeof locals[varName] === 'function') {
                getValue = locals[varName];
                setValue = function (v) {
                    locals[varName](v);
                    viewState[varName].updateView();
                };
                locals[varName] = function (v) {
                    if (v === undefined) {
                        return originalLocalValue();
                    }
                    originalLocalValue(v);
                    viewState[varName].updateView();
                };
            } else {
                getValue = function () {
                    return originalLocalValue;
                };
                setValue = function (v) {
                    originalLocalValue = v;
                    viewState[varName].updateView();
                };
                Object.defineProperty(locals, varName, {
                    get: getValue,
                    set: setValue
                });
            }

            var viewUpdateFuncions = [];

            viewState[varName] = {
                updateView: function () {
                    viewUpdateFuncions.forEach(function (fn) {
                        fn();
                    });
                }
            };

            rootNode.find('.bind-' + varName).each(function () {
                var node = $(this);
                var tagName = node.get(0).tagName.toLowerCase();

                var viewUpdateFn;
                if (['textarea', 'input', 'select'].indexOf(tagName) !== -1) {
                    viewUpdateFn = function () {
                        node.val(getValue());
                    };
                    node.bind('keyup', function () {
                        var val = node.val();
                        if (val !== getValue()) {
                            setValue(val);
                        }
                    });
                } else {
                    viewUpdateFn = function () {
                        node.html(getValue());
                    };
                }
                viewUpdateFuncions.push(viewUpdateFn);
            });

            viewState[varName].updateView();

            rootNode.find('.click-' + varName).bind('click', function (event) {
                event.preventDefault();
                setValue(event);
            });
        });
        return rootNode;
    }

    function main() {
        var exSetName = getCurrentExerciseSetName();
        loadExerciseSet(exSetName)
            .then(function (exSet) {
                getMainContentNode().html(getTemplate('exercise-set', {
                    exSetName: exSet.name,
                    onCheckClick: function (event) {
                        console.log('CLICK', event);
                    },
                    exercises: (exSet.exercises || []).map(function (exercise, index) {
                        var locals =  {
                            exIndex: index + 1,
                            exQuestion: exercise.question.join(' '),
                            exSolution: function (v) {
                                return v === undefined ? exercise.userSolution : exercise.userSolution = v;
                            }
                        };

                        return getTemplate('exercise', locals);
                    })
                }));
            })
            .catch(function loadingError(err) {
                console.error(err);
                getMainContentNode().html(getTemplate('loading-error-screen', {
                    exSetName: exSetName
                }));
            });
    }

    main();
});