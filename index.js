'use strict';

var throttle = require('throttleit');

function onRequest(context) {
    // Reset dynamic stuff
    context.startedAt = null;

    context.state = context.request.progressState = null;

    context.delayTimer && clearTimeout(context.delayTimer);
    context.delayTimer = null;
}

function onResponse(context, response) {
    // Mark start timestamp
    context.startedAt = Date.now();

    // Create state
    // Also expose the state throught the request
    // See https://github.com/IndigoUnited/node-request-progress/pull/2/files
    context.state = context.request.progressState = {
        time: {
            elapsed: 0,
            remaining: null
        },
        speed: null,
        percent: null,
        size: {
            total: Number(response.headers[context.options.lengthHeader]) || null,
            transferred: 0,
            previousTransfer: 0
        },
        data :null
    };

    // Delay the progress report
    context.delayTimer = setTimeout(function () {
        context.delayTimer = null;
    }, context.options.delay);
}

function onData(context, data) {
    context.state.size.transferred += data.length;
    context.state.size.previousTransfer += data.length;
    
    if ( context.options.bRetainData )
    {
        context.state.data = context.state.data === null ? data : Buffer.concat([context.state.data, data]);
    }

    !context.delayTimer && context.reportState();
}

function onEnd(context) {
    /* istanbul ignore if */
    if (context.delayTimer) {
        clearTimeout(context.delayTimer);
        context.delayTimer = null;
    }

    context.request.progressState = context.request.progressContext = null;
}

function EmitProgress(context,state)
{
    context.request.emit('progress', state);
    state.size.previousTransfer = 0;
    if (state.data)
    {
        state.data = null;
    }
}

function reportState(context) {
    var state;

    // Do nothing if still within the initial delay or if already finished
    if (context.delayTimer || !context.request.progressState) {
        return;
    }

    state = context.state;
    state.time.elapsed = (Date.now() - context.startedAt) / 1000;

    // Calculate speed only if 1s has passed
    if (state.time.elapsed >= 1) 
    {
        state.speed = state.size.transferred / state.time.elapsed;
    }

    // Calculate percent & remaining only if we know the total size
    if (state.size.total != null) 
    {
        state.percent = Math.min(state.size.transferred, state.size.total) / state.size.total;

        if (state.speed != null) 
        {
            state.time.remaining = state.percent !== 1 ? (state.size.total / state.speed) - state.time.elapsed : 0;
            state.time.remaining = Math.round(state.time.remaining * 1000) / 1000;  // Round to 4 decimals
        }
    }
    EmitProgress(context,state);
}


function requestProgress(request, options) {
    var context;

    if (request.progressContext) {
        return request;
    }

    if (request.response) {
        throw new Error('Already got response, it\'s too late to track progress');
    }

    // Parse options
    options = options || {};
    options.throttle = options.throttle == null ? 1000 : options.throttle;
    options.delay = options.delay || 0;
    options.lengthHeader = options.lengthHeader || 'content-length';
    options.bRetainData = options.bRetainData || false;

    // Create context
    context = {};
    context.request = request;
    context.options = options;
    context.reportState = throttle(reportState.bind(null, context), options.throttle);
    // context.startedAt = null;
    // context.state = null;
    // context.delayTimer = null;

    // Attach listeners
    request
    .on('request', onRequest.bind(null, context))
    .on('response', function handleResponse(response) {
        response.on('data', onData.bind(null, context));
        return onResponse(context, response);
    })
    .on('end', onEnd.bind(null, context));

    request.progressContext = context;

    return request;
}

module.exports = requestProgress;