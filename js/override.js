$(function() {
    var settings, time_units;

    var getSettings = function() {
        chrome.storage.sync.get('trackr_settings', function(data) {
            if (data.trackr_settings) {
                settings = data.trackr_settings;
                time_units = settings.time_units;
            }
        });
    };

    var exportData = function() {
        chrome.storage.local.get('trackr', function(data) {
            if (! $.isEmptyObject(data)) {
                
                var result = JSON.stringify(data);
                var url = 'data:application/json;base64,' + btoa(result);
                chrome.downloads.download({
                    url: url,
                    filename: 'trackr_' + (new Date()).getTime() + '.json'
                });
            }
        });
    };

    var importData = function(res) {
        try {
            var data = JSON.parse(res);
            chrome.storage.local.set(data);
            location.reload();
        } catch (ex) {
            console.error(ex);
        }
    };

    getSettings();

    $('.container #clear').on('click', function() {
        exportData();
        chrome.storage.local.remove('trackr');
        location.reload();
    });

    $('.container').on('click', '#import', function() {
        console.log('testtt');
        $('.container #fileid').click();
    });

    $('.container').on('change', '#fileid', function() {
        var file = $('.container #fileid')[0].files[0];
        if (file) {
            var reader = new FileReader();
            reader.readAsText(file, "UTF-8");
            reader.onload = function (evt) {
                importData(evt.target.result);
            };
            reader.onerror = function (evt) {
                console.log('error reading file');
            };
        }
    });

    chrome.storage.local.get('trackr', function(data) {
        if ($.isEmptyObject(data)) {
            var $container = $('.container');
            $container.empty();
            $container.append('<div class="message"><h1>No URLs are tracked yet!</h1><input id="fileid" type="file" hidden/><button id="import">Import</button></div>');
            return;
        }

        var chartData = [];
        var options = {
            animation: false,
            responsive: true,
            segmentShowStroke: false,
            legendTemplate: '<table class=\"u-full-width <%=name.toLowerCase()%>-legend\"><thead><tr><th>Color</th><th>Title</th><th>Time (' + time_units + ')</th></tr></thead><% for (var i=0; i<segments.length; i++){%><tr><td><span class=\"color-box\" style=\"background-color:<%=segments[i].fillColor%>\"></span></td><td class=\"label\"><a href=\"http://<%=segments[i].label%>\" style=\"color:<%=segments[i].fillColor%>;text-decoration:none\"><%if(segments[i].label){%><%=segments[i].label%><%}%></a></td><td class=\"value\"><%if(segments[i].value){%><%=segments[i].value%><%}%></td></tr><%}%></table>'
        };
        var ctx = $('#chart').get(0).getContext('2d');

        $.each(data.trackr, function(i, v) {
            if (v.time !== 0) {
                var color = $c.rand('hex');
                var backgroundColor = $c.complement(color);
                // http://stackoverflow.com/a/6134070/1042093
                var value = v.time * 5;
                switch (time_units) {
                    case 'seconds':
                        break;
                    case 'minutes':
                        value = value / 60;
                        break;
                    case 'hours':
                        value = value / 3600;
                        break;
                }
                value = parseFloat(parseFloat(Math.round(value * 100) / 100).toFixed(2));
                if (value === 0) return;
                chartData.push({
                    value: value,
                    color: color,
                    highlight: backgroundColor,
                    label: v.title
                });
            }
        });

        var chart = new Chart(ctx).Doughnut(chartData, options);
        var legend = chart.generateLegend();

        $('.legend').html(legend);
        $('.legend table').tablesorter({
            sortList: [
                [2, 1]
            ],
            headers: {
                0: {
                    sorter: false
                }
            }
        });
    });
});
