init:
	pip install -r requirements.txt

default:
	python3 app/main.py ${PARAMS}

test:
	nosetests tests
