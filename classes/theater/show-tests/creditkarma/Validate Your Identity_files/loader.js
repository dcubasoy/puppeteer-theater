;(function() {
    var queryParamBlackList = [
        'token', //Reset Password
        'code',  //Acct recovery
        '_k2',   //OTC verification
    ]

    var iframe = document.createElement('iframe');
    var frameBaseUrl = 'https://tags.creditkarma.com';
    iframe.src = frameBaseUrl +
                window.location.pathname +
                cleanUrlParams(window.location.search, queryParamBlackList);

    iframe.setAttribute('id', 'tIFrame');
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    iframe.setAttribute('style', 'width:0; height:0; border:0; border:none; visibility:none; position:absolute;');

    iframe.onload = function() {
        var iframeEl = document.getElementById('tIFrame');
        var iframeParameters = {
            top_url: window.location.pathname,
            traceId: window.TRACE_ID ? window.TRACE_ID : '',
            utag: {
                customer_id: getCookieId()
            },
            IS_PRODUCTION: window.IS_PRODUCTION || window.PROD
        }
        iframeEl.contentWindow.postMessage(iframeParameters, '*');
    }

    document.body.appendChild(iframe);

    function getCookieId() {
        var cookieId = null;
        document.cookie.replace(/CKTRKID=(\w+)/g, function(m, id) {
            cookieId = id;
        })
        if (!cookieId) {
            // we may have a debug/development CKTRKIDDBG
            document.cookie.replace(/CKTRKIDDBG=(\w+)/g, function(m, id) {
                cookieId = id;
            })
        }
        return cookieId;
    }

    function cleanUrlParams(params, blackList) {
        var tail = params.split('?')[1];
        if (!tail) { return ""; }
        var reg = new RegExp('^' + blackList.join('|^'), 'i')

        function paramFilter(param) {
            return !reg.test(param);
        }

        return '?' + tail.split('&').filter(paramFilter).join('&');
    }
    
    //For testing purposes
    if (window.IS_PRODUCTION != true && window.PROD != true) {
        window.cleanUrlParams = cleanUrlParams;
    }
})();
