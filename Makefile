init:
	pip install -r requirements.txt

poli_stats:
	python3 app/main.py ${PARAMS}

test:
	nosetests tests
