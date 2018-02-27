#!/usr/bin/env python3

import sys
import subprocess
import numpy as np
import png

if len(sys.argv) < 2:
  sys.exit()

def get_data(id):
	name = subprocess.run(['xprop', '-id', id, 'WM_CLASS'], stdout=subprocess.PIPE)
	name = name.stdout.decode('utf-8')[19:].split(',')[0].replace('"', '')

	result = subprocess.run(['xprop', '-id', id, '-notype', '32c', '_NET_WM_ICON'], stdout=subprocess.PIPE)
	result = result.stdout.decode('utf-8')[15:]

	data = [int(x) for x in result.split(',')]
	return (name, data)

def uint_to_rgba(x):
	(a, r, g, b) = x.to_bytes(4, byteorder='big', signed=False)
	return (r, g, b, a)

(name, data) = get_data(sys.argv[1])

pos = 0
while True:
	x = data[pos]
	y = data[pos + 1]
	icon = data[pos + 2 : x * y + pos + 2]
	icon = [uint_to_rgba(p) for p in icon]
	icon = np.array(icon).ravel().reshape((y, x*4))

	file = open('icons/%s_%i_%i.png' % (name, x, y), 'wb')
	w = png.Writer(x, y, alpha=True)
	w.write(file, icon)
	file.close()

	pos = x * y + pos + 2
	if pos >= len(data):
		break
