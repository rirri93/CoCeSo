<!DOCTYPE html>
<%@taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@taglib uri="http://www.springframework.org/tags" prefix="spring"%>
<%@taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt"%>
<%@taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn"%>
<%@taglib uri="coceso" prefix="t"%>
<%--
/**
 * CoCeSo
 * Patadmin HTML info patient details
 * Copyright (c) WRK\Coceso-Team
 *
 * Licensed under the GNU General Public License, version 3 (GPL-3.0)
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright Copyright (c) 2015 WRK\Coceso-Team
 * @link https://github.com/wrk-fmd/CoCeSo
 * @license GPL-3.0 ( http://opensource.org/licenses/GPL-3.0 )
 */
--%>
<html>
  <head>
    <t:head maintitle="patadmin" title="patadmin.info" entry="navbar"/>
  </head>
  <body>
    <div class="container">
      <%@include file="navbar.jsp"%>

      <h2><spring:message code="patient"/>: <em><c:out value="${patient.fullName}"/></em></h2>

      <dl class="dl-horizontal">
        <dt>ID</dt>
        <dd class="clearfix"><c:out value="${patient.id}"/></dd>

        <dt><spring:message code="patient.externalId"/></dt>
        <dd class="clearfix"><c:out value="${patient.externalId}"/></dd>

        <dt><spring:message code="patient.lastname"/></dt>
        <dd class="clearfix"><c:out value="${patient.lastname}"/></dd>

        <dt><spring:message code="patient.firstname"/></dt>
        <dd class="clearfix"><c:out value="${patient.firstname}"/></dd>

        <c:if test="${not empty patient.group}">
          <dt><spring:message code="patadmin.group"/></dt>
          <dd class="clearfix">
            <c:forEach items="${patient.group}" var="group">
              <c:out value="${group.call}"/>
            </c:forEach>
          </dd>
        </c:if>
        <c:if test="${not empty patient.hospital}">
          <dt><spring:message code="patadmin.hospital"/></dt>
          <dd class="clearfix">
            <c:forEach items="${patient.hospital}" var="hospital">
              <c:out value="${hospital}"/>
            </c:forEach>
          </dd>
        </c:if>
        <c:if test="${not patient.transport and patient.done}">
          <dt><spring:message code="patient.discharged"/></dt>
          <dd class="clearfix"><spring:message code="yes"/></dd>
        </c:if>
      </dl>

        <h3><spring:message code="log"/></h3>
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th><spring:message code="log.timestamp"/></th>
              <th><spring:message code="incident"/></th>
              <th><spring:message code="unit"/></th>
              <th><spring:message code="task.state"/></th>
            </tr>
          </thead>
          <tbody>
            <c:forEach items="${logs}" var="log">
              <tr>
                <td><fmt:formatDate type="both" dateStyle="short" timeStyle="medium" value="${log.timestamp}"/></td>
                <td>
                  <c:if test="${not empty log.incident}">
                    <t:inctitle incident="${log.incident}"/>
                  </c:if>
                </td>
                <td>
                  <c:if test="${not empty log.unit}">
                    <c:out value="${log.unit.call}"/>
                  </c:if>
                </td>
                <td>
                  <c:if test="${not empty log.state}">
                    <spring:message code="task.state.${fn:toLowerCase(log.state)}" text="${log.state}"/>
                  </c:if>
                </td>
              </tr>
            </c:forEach>
          </tbody>
        </table>
    </div>
  </body>
</html>
