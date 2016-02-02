var Wordnik = {
    get: function(path){
        var base = "http://api.wordnik.com/v4/";
        var query_params = "?useCanonical=false&api_key=a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
        return $.ajax({
            url: base+path+query_params,
            async: false
        });
    }
};

function Line(targetCount){
    this.targetCount = 0;
    this.leeway = 0;
    this.runningCount = 0;
    this.dummy = false;
    this.raw = '';
    if(targetCount){
        this.targetCount = targetCount;
    }
}

Line.prototype.percent = function(){
    if(this.targetCount===0){
        return '0';
    }
    var p = (this.runningCount/this.targetCount)*10;
    return (parseInt(Math.floor(p))*10)+'';
}

Line.prototype.status = function(){
    if(this.targetCount==0){
        return '';
    } else if (this.runningCount > this.targetCount) {
        return 'has-error';
    } else if (this.runningCount < this.targetCount) {
        return 'has-warning';
    } else {
        return 'has-success';
    }
}

var app = angular.module('haiku', []);
app.controller('Ctrl', ['$scope', function($scope){

    $scope.lines = [new Line()];
    $scope.splitSource = 'algo';

    function getSyllables(word){
        word = word.replace(/\W/g, '');
        if(!word){
            return 0;
        }

        if ($scope.splitSource === 'api'){
            console.log('using dict api');
            var path = "word.json/"+word+"/hyphenation";
            var count = 0;

            Wordnik.get(path).done(function(data){
                count = data.length;
            });

            return count;
        } else {
            console.log('using algo');
            return hypCountSyllables(word);
        }
    }

    function countSyllables(line){
        var words = line.split(/\s|\-/);
        var counts = words.map(getSyllables);
        return counts.reduce(function(a, b){ return a+b; }, 0);
    }

    $scope.newLine = function(copyLast){

        var lastLine = $scope.lines[this.lines.length-1];
        if(lastLine.raw === '') {
            return;
        }

        var target = 0;
        if (copyLast) {
            target = lastLine.targetCount;
        }
        var newLine = new Line(target);
        $scope.lines.push(newLine);
    };

    $scope.onLineChange = function(line){
        line.runningCount = countSyllables(line.raw);

        $scope.newLine(true);
    };

    $scope.deleteLine = function(index){
        $scope.lines.splice(index, 1);
        //$scope.$apply();
    }

    $scope.newStanza = function(){
        var newLine = new Line();
        newLine.dummy = true;
        $scope.lines.push(newLine);
        $scope.lines.push(new Line());

        console.log($scope.lines);
    };

    $scope.download = function() {
        var rawLines = $scope.lines.map(function(e){ return e.raw; });
        var text = rawLines.join('\n');

      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', 'lyrics.txt');

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    }


}]);

app.directive('lineTarget', function(){
    return {
        restrict: 'E',
        scope: {
            line: '=line'
        },
        link: function (scope, element) {
            scope.editing = false;

            scope.changeTarget = function(){
                scope.editing = true;
            };

            scope.saveTarget =  function(){
                scope.editing = false;
            }
        },
        transclude: true,
        templateUrl: 'templates/target_count.html'
        
    };
});