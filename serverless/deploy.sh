#!/bin/bash

doctl serverless connect skybuds

doctl serverless deploy . --build-env ./.env --env ./.env -v --verbose-build