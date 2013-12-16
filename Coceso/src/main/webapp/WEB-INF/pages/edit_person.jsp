<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>

<html>
<head>
    <title><spring:message code="label.coceso"/> - <spring:message code="label.person.edit"/></title>

    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Bootstrap -->
    <c:url var="bootstrap" value="/static/bootstrap.css" />
    <link href="${bootstrap}" rel="stylesheet">

    <c:url var="bootstrap_theme" value="/static/bootstrap-theme.css" />
    <link href="${bootstrap_theme}" rel="stylesheet">

</head>
<body>

<div class="container">

    <c:set value="active" var="nav_person" />
    <%@include file="parts/navbar.jsp"%>

    <div class="page-header">
        <h2>
            <spring:message code="label.person.edit"/>: <strong>${p_person.sur_name} ${p_person.given_name}</strong>
        </h2>
    </div>
    <div>
        <form role="form" action="<c:url value="/edit/person/update" />" method="POST">
            <div class="row">
                <input type="hidden" name="id" value="${p_person.id}">
                <div class="form-group col-lg-4">
                    <label>
                        <spring:message code="label.person.given_name"/>
                        <input type="text" class="form-control" name="given_name" value="${p_person.given_name}">
                    </label>
                </div>
                <div class="form-group col-lg-4">
                    <label>
                        <spring:message code="label.person.sur_name"/>
                        <input type="text" class="form-control" name="sur_name" value="${p_person.sur_name}">
                    </label>
                </div>
                <div class="form-group col-lg-4">
                    <label>
                        <spring:message code="label.person.dnr"/>
                        <input class="form-control" name="dNr" value="${p_person.dNr}">
                    </label>
                </div>
            </div>
                <div class="form-group">
                    <label>
                        <spring:message code="label.person.contact"/><textarea class="form-control" rows="5" name="contact">${p_person.contact}</textarea>
                    </label>
                </div>
                <div class="form-group">
                    <input type="submit" class="btn btn-success">
                </div>
        </form>
    </div>

</div>

<!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
<c:url var="jquery" value="/static/jquery.js" />
<script src="${jquery}"></script>
<!-- Include all compiled plugins (below), or include individual files as needed -->
<c:url var="bootstrap_js" value="/static/bootstrap.js" />
<script src="${bootstrap_js}"></script>

</body>
</html>