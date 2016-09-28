#!/usr/bin/env node
'use strict';

// https://github.com/75lb/command-line-args

const dnsLegacy = require('dns');
const commandLineArgs = require('command-line-args')
const dns = require('native-dns');
const getUsage = require('command-line-usage');

const optionDefinitions = [
  {
      name: 'dns-scan',
      type: Boolean,
      description: 'Scan to detect the dns servers available.'
  },
  {
      name: 'dns-req',
      type: String,
      multiple: true,
      description: 'Request a dns server in order to get the ip address from a domain name. If the option [bold]{server} is added, it asks this target server. Otherwise, it used the [bold]{dns-scan} to find the servers.',
      typeLabel: '[underline]{domain name}'
  },
  {
      name: 'server',
      type: String,
      description: 'Specify the dns server to target with a ip address.',
      typeLabel: '[underline]{ip address}'
  },
  {
      name: 'port',
      type: Number,
      defaultValue: 53,
      description: 'Specify the port to use for the server specified with [bold]{server}.',
      typeLabel: '[underline]{number}'
  },
  {
      name: 'auto',
      alias: 'a', type: Boolean,
      description: 'Start a auto diagnostic in order to find if the network is a elqui network.',
  },
  {
      name: 'help', alias: 'h', type: Boolean,
      description: 'Display this help.',

  }

];

const sections = [
    {
        header: 'netdiag',
        content: 'A CLI tool to diagnostic networks'
    },
    {
        headers: 'Options',
        optionList: optionDefinitions
    }
];
const usage = getUsage(sections)


var options = null;

try {
    options = commandLineArgs(optionDefinitions);
} catch (e) {
    console.log('unknown command, please see the documentation:');
    console.log('netdiag -h');
    process.exit(2);
}

if (options['auto']) {
    options['dns-req'] = [ 'elqui.pro' ];
}


if (options['help']) {
    console.log(usage);
    process.exit(0);
}

if (!options['dns-scan'] && !options['dns-req'] && !options['auto']) {
    console.log('unknown command, please see the documentation:');
    console.log('netdiag -h');
    process.exit(2);
}

if (options['dns-scan'] || options['auto']) {
    console.log('dns servers detected: '+JSON.stringify(dnsLegacy.getServers()))
}

if (options['dns-req'].length  || options['auto']) {
    if (options['server']) {
        options['dns-req'].forEach(function (request) {
            var question = dns.Question({
                name: request,
                type: 'A',
            });

            var req = dns.Request({
                question: question,
                server: {address: options['server'], port: options['port'], type: 'udp'},
                timeout: 2000
            }).on('timeout', function () {
                console.log('dns request for '+request+' on server ' + options['server'] + ': timed out');
            }).on('message', function (err, answer) {
                answer.answer.forEach(function (a) {
                    console.log('dns request for '+request+' on server ' + options['server'] + ': '+a.address);
                });
            }).on('end', function () {
            });

            req.send();
        }) ;
    } else {
        options['dns-req'].forEach(function (req) {
            dnsLegacy.resolve4(req, function (err, addresses) {
               if (err) {
                   console.log('dns auto request for '+req+': '+err);
               } else {
                   console.log('dns auto request for '+req+': '+JSON.stringify(addresses));
               }
            });
        });
    }
}
