/*global $,getTemplate*/
$(function () {
    function getCurrentExerciseSetName() {
        var hash = window.location.hash;
        return hash.substr(1);
    }

    function loadExerciseSet(setName) {
        return $.getJSON({url: 'exercises/' + setName + '.json'});
    }

    function getMainContentNode() {
        return $('#main-content');
    }

    function exerciseView(ex, index) {
        var locals =  {
            exIndex: index + 1,
            exQuestion: ex.question.join(' ').replace('{{solution}}', ex.solution),
            exSolution: function (v) {
                return v === undefined ? ex.userSolution : ex.userSolution = v;
            }
        };
        ex.locals = locals;
        return getTemplate('exercise', locals);
    }

    function exerciseSetView(exSet) {
        return getTemplate('exercise-set', {
            exSetName: exSet.name,
            onCheckClick: function () {
                exSet.exercises.forEach(function (ex) {
                    var sol = eval(ex.solution);
                    var isValid = sol === parseInt(ex.locals.exSolution());
                    ex.locals.checkResult = isValid ? 'Dobrze!' : 'Źle:(';
                });
            },
            exercises: (exSet.exercises || []).map(exerciseView)
        });
    }

    function main() {
        var exSetName = getCurrentExerciseSetName();
        loadExerciseSet(exSetName)
            .then(function (exSet) {
                getMainContentNode().html(exerciseSetView(exSet));
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