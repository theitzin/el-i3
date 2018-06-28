#!/usr/bin/env python3

import sys
import subprocess
import numpy as np
import png

if len(sys.argv) < 2:
  sys.exit()

def get_data(id):
	name = subprocess.run(['xprop', '-id', id, 'WM_CLASS'], stdout=subprocess.PIPE)
	name = name.stdout.decode('utf-8')[19:].split(',')[-1].strip().replace('"', '')

	# default len too small to get icon >128x128 in size
	result = subprocess.run(['xprop', '-id', id, '-len', '1000000', '-notype', '32c', '_NET_WM_ICON'], stdout=subprocess.PIPE)
	result = result.stdout.decode('utf-8')[15:]
	
	# property does not exist
	if result == 'not found.\n':
		subprocess.call(['cp', 'icons/png/default.png', 'icons/png/%s.png' % name])
		sys.exit()

	data = [int(x) for x in result.split(',')]
	return (name, data)

def uint_to_rgba(x):
	(a, r, g, b) = x.to_bytes(4, byteorder='big', signed=False)
	return (r, g, b, a)

(name, data) = get_data(sys.argv[1])

pos = 0
largest = 0
largest_path = ''
for _ in range(10): # max iteration in case something goes wrong
	x = data[pos]
	y = data[pos + 1]
	if x * y + pos + 2 > len(data): # should only happen if error in data
		break
	icon = data[pos + 2 : x * y + pos + 2]
	icon = [uint_to_rgba(p) for p in icon]
	icon = np.array(icon).ravel().reshape((y, x*4))

	file_path = 'icons/png/all_sizes/%s_%i_%i.png' % (name, x, y)
	file = open(file_path, 'wb')
	w = png.Writer(x, y, alpha=True)
	w.write(file, icon)
	file.close()

	if x > largest:
		largest = x
		largest_path = file_path

	pos = x * y + pos + 2
	if pos >= len(data):
		break

subprocess.call(['cp', largest_path, 'icons/png/%s.png' % name])
